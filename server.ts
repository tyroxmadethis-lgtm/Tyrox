import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up storage with multer
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (req.path.includes("upload-photo")) {
        const dest = path.join(process.cwd(), "public", "static", "images");
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      } else {
        const dest = path.join(process.cwd(), "public");
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      }
    },
    filename: (req, file, cb) => {
      if (req.path.includes("upload-photo")) {
        cb(null, "tyrox_profile.jpg");
      } else {
        cb(null, "banner.jpg");
      }
    },
  });

  const upload = multer({ storage });

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Router - Upload Banner
  app.post("/admin/about/upload-banner", upload.single("file"), (req, res) => {
    try {
      console.log("Server received banner upload request.", req.file);
      res.json({ success: true, filePath: "/banner.jpg" });
    } catch (error: any) {
      console.error("Banner upload error in server:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Router - Upload Profile Photo
  app.post("/admin/about/upload-photo", upload.single("file"), (req, res) => {
    try {
      console.log("Server received photo upload request.", req.file);
      res.json({ success: true, filePath: "/static/images/tyrox_profile.jpg" });
    } catch (error: any) {
      console.error("Photo upload error in server:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Router - Edit Text (Mock placeholder backend save)
  app.post("/admin/about/edit-text", (req, res) => {
    try {
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Router - Edit Socials (Mock placeholder backend save)
  app.post("/admin/about/edit-socials", (req, res) => {
    try {
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite development middleware vs Static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
