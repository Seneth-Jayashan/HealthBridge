# Telemedicine Service (Agora Integration)

This microservice manages secure doctor-patient video sessions and generates short-lived Agora RTC tokens server-side.

## Environment Variables

- `PORT` (default: `3008`)
- `MONGO_URI`
- `MONGO_DB_NAME`
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`
- `AGORA_TOKEN_TTL_SECONDS` (default: `3600`)

## API Endpoints

All endpoints are protected and require valid gateway-injected auth headers (`x-user-id`, `x-user-role`).

- `POST /sessions` (Doctor, Admin)
- `GET /sessions/my` (Doctor, Patient, Admin)
- `GET /sessions/:sessionId` (Doctor, Patient, Admin)
- `POST /sessions/:sessionId/token` (Doctor, Patient)
- `PATCH /sessions/:sessionId/start` (Doctor)
- `PATCH /sessions/:sessionId/end` (Doctor)

## Security Notes

- Agora App Certificate is never returned to clients.
- Tokens are generated per user and are short-lived.
- Only session participants can request join tokens.
- Only the assigned doctor can start/end the consultation state.
