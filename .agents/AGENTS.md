# Project-Specific Rules & Environment Guidelines

## 1. Environment Configurations (.env)

Always preserve these exact keys in the backend `.env` file. Do not overwrite or revert them:

### Database Settings
*   **Local/Development Database:** `mongodb://.../microvison?replicaSet=...` (uses the `microvison` database name)
*   **Production Database:** `mongodb://.../microvison-production?replicaSet=...` (uses the `microvison-production` database name)

### File Storage (Cloudflare R2)
The project has migrated from Cloudinary to Cloudflare R2. Never inject Cloudinary credentials. Always configure R2 variables:
*   `R2_ACCOUNT_ID="bac3f196a3cc26cd63063851dba5a84f"`
*   `R2_ACCESS_KEY_ID="102a4e216f326358b28d106075724a1d"`
*   `R2_SECRET_ACCESS_KEY="1dc434a67ef8a8577410371bcf24d437e76395120d3b3f8f8bd050386b7634c0"`
*   `R2_BUCKET_NAME="microvison-assets"`
*   `R2_PUBLIC_URL="https://pub-dd1763544f8244fbafca83dff3f922e7.r2.dev"`

### Meta WhatsApp Cloud API Configurations
*   `WHATSAPP_TOKEN="EABDWG3XPfZAwBR3R2GorV7W9RWHM1wHff4Cr1R1leBPMbTdk1axoro3Pg0hYTAJUuiLtvnFKZAgYxSk1mCcRxXdK3MJ4MFJ6Hs72zPvEsCQxjk9uJ2oNzzELPp4pVbgTbBYYZCqlF7eEMjGaAdpKIZB2zDrv0mqsOV3Lxe2JOsgjNDWzHq385nNvhNxoyAZDZD"`
*   `WHATSAPP_PHONE_NUMBER_ID="1224930710696560"`
*   `SUPPORT_PHONE="90246 62315"`
*   `PORTAL_LOGIN_URL="https://www.microvisonservice.co.in/"`

### WhatsApp Templates Mapping
Do not use `hello_world` mappings. Always preserve the active template mappings:
*   `WHATSAPP_TEMPLATE_SC_DETAILS="customer_sc_assigned2"` (Template 1)
*   `WHATSAPP_TEMPLATE_COMPLAINT_SC="sc_new_assignment"` (Template 2)
*   `WHATSAPP_TEMPLATE_ASSIGNMENT_REMINDER="sc_assignment_reminder"` (Template 3 - 6 params)
*   `WHATSAPP_TEMPLATE_POST_ACCEPT_REMINDER="sc_post_accept_reminder"` (Template 4 - 6 params)
*   `WHATSAPP_TEMPLATE_NOT_DONE_REMINDER="sc_not_done_reminder"` (Template 5 - 5 params)
*   `WHATSAPP_TEMPLATE_PART_DISPATCHED="sc_part_dispatched"` (Template 6 - 5 params)
*   `WHATSAPP_TEMPLATE_PART_RECEIVED_REMINDER="sc_part_received_reminder"` (Template 7 - 5 params)
