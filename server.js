require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

const {
  PORT = 3000,
  SESSION_SECRET,
  AGENT_CODES = "",
  COMMAND_CODES = "",
  APPLY_URL = "#",
} = process.env;

const AGENT_LIST = AGENT_CODES.split(",").map((s) => s.trim()).filter(Boolean);
const COMMAND_LIST = COMMAND_CODES.split(",").map((s) => s.trim()).filter(Boolean);

// ---------- Config de base ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: SESSION_SECRET || "dev_secret_a_changer",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8h
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.applyUrl = APPLY_URL;
  next();
});

// ---------- Détermination du niveau d'habilitation à partir d'un code ----------
function clearanceForCode(code) {
  if (!code) return null;
  const clean = code.trim();
  if (COMMAND_LIST.includes(clean)) return "COMMANDEMENT";
  if (AGENT_LIST.includes(clean)) return "AGENT";
  return null; // code invalide -> citoyen, jamais connecté
}

// ---------- Middlewares de protection ----------
const ORDER = { CITOYEN: 0, AGENT: 1, COMMANDEMENT: 2 };

function requireClearance(minLevel) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).render("access-denied", {
        title: "Accès refusé",
        clearance: "CITOYEN",
        reason: "no-auth",
      });
    }
    const clearance = req.session.user.clearance;
    if (ORDER[clearance] < ORDER[minLevel]) {
      return res.status(403).render("access-denied", {
        title: "Accès refusé",
        clearance,
        reason: "insufficient",
      });
    }
    next();
  };
}

// ================= PAGES PUBLIQUES =================

app.get("/", (req, res) => {
  res.render("index", { title: "Federal Investigation Bureau" });
});

app.get("/recrutement", (req, res) => {
  res.render("recrutement", { title: "Recrutement — FIB" });
});

// ================= CONNEXION PAR CODE =================

app.get("/connexion", (req, res) => {
  res.render("connexion", { title: "Connexion — FIB", error: null, callsign: "" });
});

app.post("/connexion", (req, res) => {
  const { callsign = "", code = "" } = req.body;
  const clearance = clearanceForCode(code);

  if (!clearance) {
    // Code invalide ou absent -> citoyen sans rôle autorisé, jamais authentifié
    return res.status(401).render("connexion", {
      title: "Connexion — FIB",
      error: "Code d'accès invalide. Vous n'êtes pas habilité à accéder à cet espace.",
      callsign,
    });
  }

  req.session.user = {
    name: callsign.trim() || "Agent",
    clearance,
  };

  if (clearance === "COMMANDEMENT") return res.redirect("/commandement");
  return res.redirect("/espace-agent");
});

app.get("/deconnexion", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ================= ESPACES PROTÉGÉS =================

app.get("/espace-agent", requireClearance("AGENT"), (req, res) => {
  res.render("dashboard", { title: "Espace Agent — FIB" });
});

app.get("/commandement", requireClearance("COMMANDEMENT"), (req, res) => {
  res.render("commandement", { title: "Niveau Commandement — FIB" });
});

// ================= 404 =================
app.use((req, res) => {
  res.status(404).render("access-denied", {
    title: "Page introuvable",
    clearance: req.session.user ? req.session.user.clearance : "CITOYEN",
    reason: "not-found",
  });
});

app.listen(PORT, () => {
  console.log(`FIB — serveur lancé sur http://localhost:${PORT}`);
});
