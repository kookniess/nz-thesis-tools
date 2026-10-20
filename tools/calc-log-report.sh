#!/bin/bash
# Summarise calculator-experiment traffic from the Caddy access log on the production host.
# Shows (1) hits carrying the test UTM, (2) any hit whose Referer is claude.ai / claudeusercontent.com,
# (3) search-engine bots that followed a link into the site with the test UTM.   Usage: ./calc-log-report.sh [days]
DAYS=${1:-30}
ssh -i ~/.ssh/id_ed25519_mythesis ubuntu@140.238.207.102 "sudo cat /srv/mythesis/caddy/data/access.log /srv/mythesis/caddy/data/access.log.*[0-9] 2>/dev/null" | python3 -c '
import sys,json,time,collections
days=float(sys.argv[1]); since=time.time()-days*86400
utm=collections.Counter(); ref=collections.Counter(); bots=collections.Counter(); first=None; n=0
for line in sys.stdin:
    try: d=json.loads(line)
    except: continue
    if d.get("ts",0)<since: continue
    r=d["request"]; uri=r.get("uri",""); h=r.get("headers",{})
    ua=h.get("User-Agent",[""])[0]; rf=h.get("Referer",["-"])[0]
    if "thesis_cost_calculator_test" in uri:
        n+=1; first=first or time.strftime("%Y-%m-%d %H:%M",time.gmtime(d["ts"]))
        utm[(uri.split("?")[0], "utm_source="+(uri.split("utm_source=")[1].split("&")[0] if "utm_source=" in uri else "?"))]+=1
        if any(b in ua for b in ("Googlebot","bingbot","Google-InspectionTool","DuckDuckBot","Applebot")): bots[ua[:60]]+=1
    if "claude.ai" in rf or "claudeusercontent" in rf: ref[(rf[:70], uri.split("?")[0])]+=1
print(f"Last {days:g} days. Hits with the test UTM: {n}" + (f" (first {first} UTC)" if first else ""))
for k,v in utm.most_common(): print(f"  {v:4d}  {k[0]}  {k[1]}")
print("Referer from claude.ai / claudeusercontent.com:", sum(ref.values()))
for k,v in ref.most_common(10): print(f"  {v:4d}  {k[0]}  -> {k[1]}")
print("Search bots arriving with the test UTM:", sum(bots.values()))
for k,v in bots.most_common(): print(f"  {v:4d}  {k}")
' "$DAYS"
