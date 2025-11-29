## Daraz Helper API Guide

This service wraps Daraz Open Platform endpoints with pre-built signature logic. Share this doc with frontend teammates so they can integrate without digging into the server code.

### Base URL

- Local: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs` (also works remotely; set `SWAGGER_SERVER_URL` for correct host in Try-It-Out).

### Environment Variables

| Variable | Description |
| --- | --- |
| `APP_KEY` | Daraz app key |
| `APP_SECRET` | Daraz app secret used to sign requests |
| `SWAGGER_SERVER_URL` (optional) | Base URL exposed in Swagger server list |

### Auth APIs

#### `POST /get-daraz-token`
- Body: `{ "code": "<authorization_code_from_daraz>" }`
- Returns: `{ token, seller, seller_id }` exactly as Daraz sends back.
- Use after OAuth redirect to exchange the `code`.

#### `POST /refresh-daraz-token`
- Body: `{ "refresh_token": "...", "region": "pakistan" }`
- `region` optional; defaults to Pakistan. Valid values: myanmar, bangladesh, pakistan, sri lanka, nepal.
- Response mirrors Daraz `auth/token/refresh`.

### Order APIs

All order APIs require a valid `access_token` obtained from the auth endpoints above.

#### `GET /get-daraz-orders`
Query params:
- `access_token` (required)
- `status` (optional)
- `created_after` (ISO timestamp, optional)

Returns the raw Daraz payload from `/orders/get`.

#### `GET /get-order-items`
Query params:
- `access_token` (required)
- `order_ids` (required) — JSON array string, e.g. `[12345,67890]`

Returns the raw Daraz payload from `/orders/items/get`.

#### `GET /get-daraz-order-details`
Combines `/orders/get` + `/orders/items/get` by chunking order IDs.

Query params:
- `access_token` (required)
- `status`, `created_after`, `update_after` (optional filters)

Returns `{ countTotal, orderItems }`.

### Sample cURL Calls

```bash
# Exchange code for tokens
curl -X POST http://localhost:3000/get-daraz-token \
  -H "Content-Type: application/json" \
  -d '{"code":"YOUR_CODE"}'

# Refresh tokens
curl -X POST http://localhost:3000/refresh-daraz-token \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"REFRESH","region":"pakistan"}'

# Fetch orders by status
curl "http://localhost:3000/get-daraz-orders?access_token=TOKEN&status=pending"
```

### Testing via Swagger

1. Navigate to `/docs`.
2. Select an endpoint, click **Try it out**, fill parameters, execute.
3. Swagger shows both request payloads and Daraz responses for easy debugging.

### Notes

- All endpoints are pass-through; expect Daraz error codes/details if something fails upstream.
- Keep tokens secure—this service does not store or mask the values returned by Daraz.
- Extend the spec by updating `swaggerDefinition.paths` inside `index.js` if new routes are added.

