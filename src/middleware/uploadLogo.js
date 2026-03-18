import multer from "multer"
import path from "path"

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    cb(null, "uploads/logos")

  },

  filename: (req, file, cb) => {

    const ext = path.extname(file.originalname)

    const nombre = `taller_${req.tallerId}${ext}`

    cb(null, nombre)

  }

})

export const uploadLogo = multer({ storage })