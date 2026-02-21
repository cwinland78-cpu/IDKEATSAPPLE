const fs = require("fs");

const APP_JSON_PATH = "./app.json";

if (!fs.existsSync(APP_JSON_PATH)) {
  console.error("❌ app.json not found in project root");
  process.exit(1);
}

const app = JSON.parse(fs.readFileSync(APP_JSON_PATH, "utf8"));

app.expo = app.expo || {};
app.expo.android = app.expo.android || {};

// ---- REQUIRED ANDROID SETTINGS ----
app.expo.android.package = "com.cwinland78.idkeats";
app.expo.android.versionCode = 192;

app.expo.android.permissions = [
  "ACCESS_FINE_LOCATION",
  "ACCESS_COARSE_LOCATION"
];

app.expo.android.config = app.expo.android.config || {};
app.expo.android.config.googleMobileAdsAppId =
  "ca-app-pub-5879329589086028~8113110806";

// ---- FIX ADMOB PLUGIN ANDROID APP ID ----
if (Array.isArray(app.expo.plugins)) {
  app.expo.plugins = app.expo.plugins.map((plugin) => {
    if (
      Array.isArray(plugin) &&
      plugin[0] === "react-native-google-mobile-ads" &&
      typeof plugin[1] === "object"
    ) {
      plugin[1].androidAppId =
        "ca-app-pub-5879329589086028~8113110806";
    }
    return plugin;
  });
}

fs.writeFileSync(APP_JSON_PATH, JSON.stringify(app, null, 2));
console.log("✅ Android config updated successfully");
