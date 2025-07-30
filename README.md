# BNB Management System

Sistema di gestione per B&B e proprietà con appartamenti e camere. Permette di gestire prenotazioni, contabilità, spese fisse/variabili e richieste.

## Funzionalità principali

1. **Gestione Proprietà e Unità**
   - Creazione e gestione di proprietà (palazzine, case, ville)
   - Gestione di unità (appartamenti, camere) all'interno delle proprietà
   - Impostazione prezzi base e stagionali

2. **Prenotazioni**
   - Calendario visuale con drag-and-drop
   - Prevenzione sovrapposizioni
   - Tracking fonte prenotazione (Booking.com, AirBnB, ecc.)

3. **Contabilità**
   - Gestione spese fisse ricorrenti (mensili/annuali)
   - Spese variabili
   - Report P&L per proprietà
   - Fatturazione

4. **Contatti e Richieste**
   - Archivio contatti con tagging
   - Gestione richieste con sistema Kanban
   - Conversione richieste in prenotazioni

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 15 con Prisma 5 come ORM
- **Autenticazione**: NextAuth con ruoli (Admin, Staff, Viewer)
- **Deployment**: Netlify con GitHub Actions per CI/CD

## Requisiti

- Node.js 20+
- Docker e Docker Compose (per il database locale)
- Git

## Setup locale

1. **Clona il repository**

```bash
git clone https://github.com/username/bnb-management-system.git
cd bnb-management-system
```

2. **Installa le dipendenze**

```bash
npm install
```

3. **Avvia il database PostgreSQL con Docker**

```bash
docker compose up -d
```

4. **Configura le variabili d'ambiente**

Crea un file `.env.local` nella root del progetto:

```
DATABASE_URL="postgresql://bnbadmin:bnbpassword@localhost:5432/bnbdb"
NEXTAUTH_SECRET="il-tuo-secret-per-nextauth"
NEXTAUTH_URL="http://localhost:3000"
```

5. **Esegui le migrazioni e popola il database**

```bash
npx prisma migrate dev
npm run seed
```

6. **Avvia l'applicazione in modalità sviluppo**

```bash
npm run dev
```

L'applicazione sarà disponibile all'indirizzo [http://localhost:3000](http://localhost:3000).

## Credenziali di default

- **Admin**: admin@example.com / change-me
- **Staff**: staff@example.com / staff-password
- **Viewer**: viewer@example.com / viewer-password

## Deployment su Netlify

1. **Collega il repository GitHub a Netlify**

2. **Configura le variabili d'ambiente su Netlify**

   - `DATABASE_URL`: URL del database PostgreSQL
   - `NEXTAUTH_SECRET`: Secret per NextAuth
   - `NEXTAUTH_URL`: URL del sito Netlify

3. **Configura la Scheduled Function per le spese fisse**

Per attivare la generazione automatica delle spese fisse il 1° di ogni mese:

1. Installa Netlify CLI: `npm install -g netlify-cli`
2. Configura la Scheduled Function:

```bash
netlify functions:create --name generate-expenses
```

Modifica il file generato per eseguire lo script:

```js
const { exec } = require('child_process');

exports.handler = async function(event, context) {
  return new Promise((resolve, reject) => {
    exec('npm run cron:expenses', (error, stdout, stderr) => {
      if (error) {
        return reject({ statusCode: 500, body: stderr });
      }
      return resolve({
        statusCode: 200,
        body: JSON.stringify({ message: "Fixed expenses generated successfully" })
      });
    });
  });
};
```

3. Imposta la pianificazione nella dashboard di Netlify:
   - Vai su "Site settings" > "Functions" > "Scheduled functions"
   - Aggiungi una nuova pianificazione con cron expression `0 0 1 * *` (esecuzione il 1° di ogni mese)

## Licenza

MIT
