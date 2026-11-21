#!/bin/sh
# Smoke test. Usage: TOKEN=<session token> scripts/smoke.sh [API_BASE_URL]   (default http://localhost:8000)
# Without TOKEN, only the public and the "needs sign-in" checks run.
set -u
BASE="${1:-http://localhost:8000}"
fail=0
check() {  # name, expected status, url [extra curl args]
  name="$1"; want="$2"; url="$3"; shift 3
  got=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$@" "$url")
  if [ "$got" = "$want" ]; then echo "ok    $name ($got)"; else echo "FAIL  $name (got $got, want $want)"; fail=1; fi
}
check "health"            200 "$BASE/health"
check "audiences public"  200 "$BASE/api/v1/audiences"
check "search needs login" 401 "$BASE/api/v1/cards?limit=1"
if [ -n "${TOKEN:-}" ]; then
  check "search"   200 "$BASE/api/v1/cards?limit=1" -H "Authorization: Bearer $TOKEN"
  check "overview" 200 "$BASE/api/v1/stats/overview" -H "Authorization: Bearer $TOKEN"
fi
check "admin needs token" 401 "$BASE/api/v1/admin/collect-runs"
cors=$(curl -s -D - -o /dev/null -m 10 -H "Origin: http://localhost:3000" "$BASE/health" | grep -i "access-control-allow-origin" || true)
[ -n "$cors" ] && echo "ok    CORS header" || { echo "FAIL  CORS header missing for Origin http://localhost:3000"; fail=1; }
exit $fail
