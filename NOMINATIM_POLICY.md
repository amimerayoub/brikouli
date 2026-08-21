# Nominatim public-service guardrails

Brikouli’s Phase 5 location search uses the public Nominatim service only for **explicit user-submitted searches**. It does not autocomplete while a person types and does not issue periodic or bulk-geocoding requests.

The implementation uses a server-side application User-Agent, in-memory cache, and a minimum one-second interval between outbound public-service requests. If production demand grows, replace the endpoint through the server configuration with a suitable provider or hosted Nominatim instance.

Source: [OpenStreetMap Foundation Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/), retrieved 2026-08-21.
