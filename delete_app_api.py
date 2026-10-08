import requests

resp = requests.get("http://localhost:8001/api/upzlab/campaigns/")
apps = resp.json().get("data", [])

deleted_any = False
for app in apps:
    if "golpe" in app.get("name", "").lower():
        print(f"Deleting app: {app['name']} (slug: {app['slug']})")
        del_resp = requests.delete(f"http://localhost:8001/api/dev/app/{app['slug']}")
        print(del_resp.status_code, del_resp.text)
        deleted_any = True

if not deleted_any:
    print("Nenhum app encontrado.")
