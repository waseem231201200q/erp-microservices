# Customer Service — ERP Microservices
**Master 1 ISI 2026 | Partie 1/5**

Microservice de gestion des clients pour l'ERP distribué d'une entreprise de distribution de produits électroniques.

---

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Runtime   | Node.js 20  |
| Framework | Express 4   |
| Base de données | MongoDB 7 (Mongoose) |
| Port      | **3001**    |
| Container | Docker      |

---

## Structure du Projet

```
customer-service/
├── src/
│   ├── config/
│   │   └── database.js         # Connexion MongoDB
│   ├── models/
│   │   └── customer.model.js   # Schéma Mongoose
│   ├── middleware/
│   │   └── validate.js         # Validation des entrées
│   ├── routes/
│   │   └── customer.routes.js  # Endpoints + Contrôleurs
│   └── server.js               # Point d'entrée Express
├── .env.example
├── .dockerignore
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## Modèle de Données

```json
{
  "_id":       "ObjectId (auto)",
  "name":      "String  — obligatoire",
  "email":     "String  — obligatoire, unique",
  "phone":     "String  — obligatoire",
  "address": {
    "street":  "String",
    "city":    "String",
    "state":   "String",
    "zip":     "String",
    "country": "String (défaut: Algérie)"
  },
  "createdAt": "Date (auto)",
  "updatedAt": "Date (auto)"
}
```

---

## API Endpoints

### `POST /api/customers` — Créer un client

**Body :**
```json
{
  "name":    "Ahmed Bensalem",
  "email":   "ahmed.bensalem@email.com",
  "phone":   "+213555123456",
  "address": {
    "street":  "12 Rue Didouche Mourad",
    "city":    "Alger",
    "country": "Algérie"
  }
}
```
**Réponse 201 :**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": { "_id": "...", "name": "Ahmed Bensalem", ... }
}
```

---

### `GET /api/customers` — Lister tous les clients

**Query params (optionnels) :**
- `page` (défaut: 1)
- `limit` (défaut: 10)
- `search` — filtre nom / email

**Exemple :** `GET /api/customers?page=1&limit=5&search=ahmed`

**Réponse 200 :**
```json
{
  "success": true,
  "data": [...],
  "pagination": { "total": 25, "page": 1, "limit": 5, "totalPages": 5 }
}
```

---

### `GET /api/customers/:id` — Récupérer un client

**Exemple :** `GET /api/customers/64f1a2b3c4d5e6f7a8b9c0d1`

**Réponse 200 :**
```json
{
  "success": true,
  "data": { "_id": "...", "name": "Ahmed Bensalem", ... }
}
```

---

### `PUT /api/customers/:id` — Mettre à jour un client

**Body :** Même structure que POST (champs à modifier)

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Client mis à jour avec succès",
  "data": { ... }
}
```

---

### `GET /health` — Health Check

```json
{
  "success": true,
  "service": "customer-service",
  "status":  "UP",
  "port":    3001
}
```

---

## Lancement

### Avec Docker Compose (recommandé)

```bash
# 1. Cloner / se placer dans le dossier
cd customer-service

# 2. Copier la config
cp .env.example .env

# 3. Démarrer tous les services
docker-compose up -d

# 4. Vérifier
curl http://localhost:3001/health
```

> Interface MongoDB Express disponible sur **http://localhost:8081** (admin / admin123)

### En local (sans Docker)

```bash
npm install
# Configurer .env avec MONGODB_URI=mongodb://localhost:27017/customer_service_db
npm run dev
```

---

## Codes de Statut HTTP

| Code | Signification |
|------|---------------|
| 200  | Succès |
| 201  | Ressource créée |
| 400  | ID invalide |
| 404  | Client non trouvé |
| 409  | Email déjà utilisé |
| 422  | Erreur de validation |
| 500  | Erreur serveur |
