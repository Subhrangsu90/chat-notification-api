require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// Load Firebase service account key from the path specified in .env file

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccount = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, serviceAccountPath), "utf8")
);

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

db.collection("chat").onSnapshot(async (snapshot) => {
	snapshot.docChanges().forEach(async (change) => {
		if (change.type === "added") {
			const message = change.doc.data();

			// Notification payload
			const payload = {
				notification: {
					title: `${message.username} says:`,
					body: message.text,
					clickAction: "FLUTTER_NOTIFICATION_CLICK",
				},
				topic: "chat",
			};

			try {
				await admin.messaging().send(payload);
			} catch (error) {
				console.error("Error sending notification:", error);
			}
		}
	});
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
