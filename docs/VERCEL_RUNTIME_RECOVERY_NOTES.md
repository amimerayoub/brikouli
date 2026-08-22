# Vercel Runtime Recovery Notes

## 2026-08-22 live verification

The supplied Vercel logs identified `ERR_MODULE_NOT_FOUND` for `/var/task/server/_core/index` when requests reached the API Function. The local repair bundle initializes successfully with `VERCEL=1`, and its full regression/build validation passed.

After pushing the recovery commit, the stable production alias continued to serve a prior deployment: an in-browser read-only check returned HTTP `500` for both the public `brikouli.gigs.listForJobSeeker` tRPC query and `/manus-storage/brikouli-symbol-optimized_2432a297.png`. Live Vercel deployment status and logs must therefore be inspected before the incident can be closed.
