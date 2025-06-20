// rowidget – Fully Transparent Roblox Stats Widget by @svvly2

const FM = FileManager.local();
const CONFIG_PATH = FM.joinPath(FM.documentsDirectory(), "robloxWidgetConfig.json");

function extractPlaceId(input) {
  const match = input.match(/(\d{5,})/);
  return match ? match[1] : null;
}
function truncate(str, len) {
  return str.length > len ? str.slice(0, len - 1) + "…" : str;
}
function errorWidget(msg) {
  const w = new ListWidget();
  w.backgroundColor = new Color("#000000", 0);
  const t = w.addText(msg);
  t.textColor = new Color("#FF3B30");
  Script.setWidget(w);
  Script.complete();
}

const inWidget = config.runsInWidget;
let universeId;

// Reconfigure if run outside widget or config missing
if (!inWidget || !FM.fileExists(CONFIG_PATH)) {
  const alert = new Alert();
  alert.title = "🎮 Roblox Game";
  alert.message = "Paste your Roblox game link or ID:";
  alert.addTextField("https://roblox.com/games/1234567890");
  alert.addAction("Save");
  await alert.present();

  const input = alert.textFieldValue(0);
  const placeId = extractPlaceId(input);
  if (!placeId) return errorWidget("❌ Invalid link or ID");

  try {
    const res = await new Request(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`).loadJSON();
    universeId = res.universeId?.toString();
    if (!universeId) throw new Error("No universe ID");
  } catch {
    return errorWidget("❌ Couldn't fetch universe ID");
  }

  FM.writeString(CONFIG_PATH, JSON.stringify({ universeId }));
} else {
  const config = JSON.parse(FM.readString(CONFIG_PATH));
  universeId = config.universeId;
}

// Fetch data
let game, iconUrl;
try {
  const gameRes = await new Request(`https://games.roblox.com/v1/games?universeIds=${universeId}`).loadJSON();
  game = gameRes.data[0];

  const iconRes = await new Request(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=150x150&format=Png&isCircular=false`).loadJSON();
  iconUrl = iconRes.data?.[0]?.imageUrl;
} catch {
  return errorWidget("❌ Failed to load game data");
}

let icon = null;
try {
  if (iconUrl) icon = await new Request(iconUrl).loadImage();
} catch {}

const size = config.widgetFamily || "medium";
let iconSize = 50, titleFont = Font.boldSystemFont(14), statFont = Font.mediumSystemFont(12), updatedFont = Font.mediumSystemFont(10);
if (size === "medium") {
  iconSize = 70;
  titleFont = Font.boldSystemFont(17);
  statFont = Font.mediumSystemFont(15);
  updatedFont = Font.mediumSystemFont(11);
} else if (size === "large") {
  iconSize = 80;
  titleFont = Font.boldSystemFont(20);
  statFont = Font.mediumSystemFont(17);
  updatedFont = Font.mediumSystemFont(13);
}

// Build widget
const w = new ListWidget();
w.setPadding(0, 0, 0, 0);
w.backgroundColor = new Color("#000000", 0); // FULLY transparent
w.url = "scriptable:///run?scriptName=" + encodeURIComponent(Script.name());
w.refreshAfterDate = new Date(Date.now() + 60 * 1000);

// Add central floating stat card
const card = w.addStack();
card.backgroundColor = new Color("#000000", 0.45); // semi-transparent black
card.cornerRadius = 18;
card.layoutHorizontally();
card.spacing = 14;
card.setPadding(16, 16, 16, 16);
card.centerAlignContent();

if (icon) {
  const img = card.addImage(icon);
  img.imageSize = new Size(iconSize, iconSize);
  img.cornerRadius = 12;
}

const textStack = card.addStack();
textStack.layoutVertically();
textStack.spacing = 6;

const title = textStack.addText(truncate(game.name, 28));
title.font = titleFont;
title.textColor = Color.white();

const playing = textStack.addText(`👥 ${game.playing.toLocaleString()} playing`);
playing.font = statFont;
playing.textColor = new Color("#EEEEEE");

const visits = textStack.addText(`👣 ${game.visits.toLocaleString()} visits`);
visits.font = statFont;
visits.textColor = new Color("#CCCCCC");

const updatedAgo = textStack.addText(`⏱ Updated just now`);
updatedAgo.font = updatedFont;
updatedAgo.textColor = new Color("#AAAAAA");

Script.setWidget(w);
Script.complete();
