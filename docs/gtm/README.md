# Tag Manager: konversijas un sīkdatņu piekrišana

Konteiners: **GTM-T4WM3GVM** ("SaimniekaPirts new").

Mājaslapa sūta uz `dataLayer` šos notikumus (`src/lib/analytics.ts`, `src/lib/consent.ts`):

| Notikums | Kad | Galvenie lauki |
|---|---|---|
| `cookie_consent_update` | apmeklētājs izvēlas sīkdatnes, un atkārtotā apmeklējumā lapas sākumā | `consent_preferences`, `consent_statistics`, `consent_marketing` (`granted` / `denied`) |
| `begin_checkout` | atver rezervācijas formu vai dāvanu kartes formu | `booking_type` (`ritual`, `noma`, `gift_card`) |
| `generate_lead` | rezervācija vai dāvanu kartes pasūtījums saglabāts | `value`, `currency`, `booking_type`, `payment_method`, `ecommerce.items` |
| `purchase` | apmaksa ar karti izdevusies | `value`, `currency`, `booking_type`, `ecommerce.transaction_id` |
| `contact` | uzspiež uz tālruņa numura | `contact_method` |

Katram notikumam ir `event_id` dublikātu novēršanai. Vārds, e-pasts, tālrunis un rezervācijas ID notikumos netiek sūtīti.

GA4 (`G-46HJJ959K8`) šos notikumus saņem tieši no mājaslapas koda. Tag Manager GA4 tagi nav vajadzīgi.

## 1. Importē tagus

1. Tag Manager atver **Admin → Import Container**.
2. Izvēlies failu `saimniekapirts-conversions.json` no šīs mapes.
3. Workspace izvēlies **Existing → Default Workspace** un opciju **Merge → Rename conflicting tags, triggers, and variables**.
4. Nospied **Confirm**.

Tiek pievienoti:
- 5 mainīgie (`DLV - …`);
- 6 trigeri (`SP - …`), kas visi nostrādā tikai tad, ja `consent_marketing` ir `granted`;
- 8 tagi: Meta InitiateCheckout, Lead, Purchase un Contact, un TikTok InitiateCheckout, SubmitForm, CompletePayment un Contact.

Visiem tagiem sadaļā Consent Settings ir prasība `ad_storage`.

## 2. Pieslēdz esošos pikseļu tagus piekrišanai

Tagiem **FB Pixel** un **TikTok Pixel**:

1. Noņem trigeri **All Pages**.
2. Pievieno trigerus **SP - Consent: marketing granted** un **SP - History change (marketing granted)**. Pirmais ielādē pikseli pēc piekrišanas, otrais skaita lapu maiņas mājaslapā.
3. Sadaļā **Advanced Settings → Consent Settings** izvēlies **Require additional consent for tag to fire** un ieraksti `ad_storage`.

## 3. Pārbaudi un publicē

1. Nospied **Preview** un atver saimniekapirts.lv.
2. Pirms piekrišanas Meta un TikTok tagiem jābūt sadaļā *Tags Not Fired*.
3. Nospied **Atļaut visas**. Tagiem FB Pixel un TikTok Pixel jānostrādā uz `cookie_consent_update`.
4. Atver rezervācijas formu un pārbaudi, ka nostrādā InitiateCheckout. Veiksmīga rezervācija izsauc Lead un SubmitForm.
5. Nospied **Submit → Publish**.

Meta Events Manager un TikTok Events Manager notikumi parādās dažu minūšu laikā. Tur arī jāizvēlas, kuru notikumu kampaņas optimizē. Iesakām **Lead**, jo `purchase` notiek tikai apmaksai ar karti.
