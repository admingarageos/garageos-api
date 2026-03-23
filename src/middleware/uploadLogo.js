import multer from "multer"
import path from "path"

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, "uploads/logos")
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const nombre = `taller_${req.tallerId}${ext}`
    cb(null, nombre)
  }

})

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("INVALID_FILE_TYPE"), false)
  }
}

export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_BYTES
  }
})