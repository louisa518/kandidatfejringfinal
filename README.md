# Kandidatfejring - live invitation

Denne version er lavet som én samlet invitation-app med:

- Login
- Info-side
- Live RSVP
- News/opslag
- Live stats og gæsteliste
- Adminpanel for Louisa
- Firebase Realtime Database
- GitHub Pages-kompatibel statisk hjemmeside

## 1. Indsæt Firebase config

Åbn `firebase-config.js` og erstat placeholderne:

```js
apiKey: "INDSAET_DIN_API_KEY_HER",
messagingSenderId: "INDSAET_DIN_MESSAGING_SENDER_ID_HER",
appId: "INDSAET_DIN_APP_ID_HER"
```

Find værdierne her:

Firebase Console → Project settings → Your apps → Web app

Database URL er allerede sat til:

```txt
https://kandidatfejring-default-rtdb.europe-west1.firebasedatabase.app
```

## 2. Sæt Firebase Rules

Gå til:

Realtime Database → Rules

Kopiér indholdet fra `firebase-rules.json` og tryk Publish.

Til hurtig test kan du midlertidigt bruge helt åbne regler:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Når siden virker, kan du sætte reglerne fra `firebase-rules.json` ind igen.

## 3. Upload til GitHub

Upload alle filer direkte i roden af dit repository.

Det skal ligge sådan:

```txt
kandidatfejring/
  index.html
  app.js
  styles.css
  firebase-config.js
  event-data.js
  firebase-rules.json
  event-image.png
  README.md
```

Ikke inde i en ekstra mappe.

## 4. GitHub Pages

Gå til:

Settings → Pages → Deploy from a branch → main → root → Save

Dit link bliver fortsat:

```txt
https://louisa518.github.io/kandidatfejring/
```

## Login

Gæster logger ind med fornavn og fornavn + 123.

Eksempel:

```txt
Brugernavn: Maya
Kode: Maya123
```

Louisa har adminpanel:

```txt
Brugernavn: Louisa
Kode: Louisa123
```

## Vigtigt

Dette er en enkel invitationsløsning uden rigtig Firebase Authentication. Det er fint til en privat festside, men ikke til følsomme data.


## Fejlfinding live

Hvis live ikke virker, åbn:

`https://louisa518.github.io/kandidatfejring/diagnose.html?v=3`

Tryk på **Skriv test-svar til Firebase**. Hvis den skriver `WRITE OK`, virker Firebase. Hvis den viser `permission_denied`, skal Firebase Rules opdateres.
