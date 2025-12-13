import requests
import json
import time

# List of countries with Burger King franchises
countries = [
    "Argentina", "Aruba", "Australia", "Austria", "Belgium", "Bolivia", "Brazil", "Bulgaria", "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Czech Republic", "Denmark", "Dominican Republic", "Ecuador", "El Salvador", "Estonia", "Finland", "France", "Germany", "Greece", "Guatemala", "Honduras", "Hong Kong", "Hungary", "India", "Indonesia", "Ireland", "Israel", "Italy", "Japan", "Kuwait", "Latvia", "Lebanon", "Lithuania", "Luxembourg", "Malaysia", "Malta", "Mexico", "Netherlands", "New Zealand", "Nicaragua", "Norway", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Qatar", "Romania", "Russia", "Saudi Arabia", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand", "Trinidad and Tobago", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Venezuela", "Vietnam"
]

overpass_url = "https://overpass-api.de/api/interpreter"

all_locations = []

counter = 0

for country in countries:
    query = f"""
    [out:json][timeout:1800];
    area["name"="{country}"]->.country;
    (
      node["amenity"="fast_food"]["brand"="Burger King"](area.country);
      way["amenity"="fast_food"]["brand"="Burger King"](area.country);
      relation["amenity"="fast_food"]["brand"="Burger King"](area.country);
    );
    out center;
    """

    print(f"Fetching Burger Kings in {country}...")
    try:
        response = requests.post(overpass_url, data={"data": query})
        response.raise_for_status()
        data = response.json()

        # Convert to simple lat/lon JSON
        locations = []
        for feature in data.get("elements", []):
            if feature["type"] == "node":
                locations.append({"id": f"bk_{counter}","lat": feature["lat"], "lon": feature["lon"]})
                counter += 1
            elif "center" in feature:
                locations.append({"id": f"bk_{counter}","lat": feature["center"]["lat"], "lon": feature["center"]["lon"]})
                counter += 1

        # Save per country
        filename = f"burgerking_{country.replace(' ', '_')}.json"
        with open(filename, "w") as f:
            json.dump(locations, f, indent=2)

        print(f"Saved {len(locations)} Burger Kings in {country} → {filename}")

        # Add to global list
        all_locations.extend(locations)

        # Avoid hitting rate limits
        time.sleep(5)

    except Exception as e:
        print(f"Error fetching {country}: {e}")

# Save merged worldwide file
with open("burgerking_worldwide.json", "w") as f:
    json.dump(all_locations, f, indent=2)

print(f"Total Burger Kings worldwide fetched: {len(all_locations)}")
