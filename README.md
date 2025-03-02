# Resume Generator

## 📌 Project Overview
This is a **Resume Generator** built using **Node.js, Express.js, and LaTeX**. It allows users to generate resumes in PDF format based on form inputs.

## 🚀 Features
- User-friendly form to input resume details
- Generates PDFs using LaTeX (`node-latex`)
- Three predefined resume templates
- Fast and efficient resume generation

## 🛠️ Installation & Setup
### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/KARTIKMAHNOT/resume-generator.git
cd resume-generator
```

### **2️⃣ Install Dependencies**
Make sure you have **Node.js** and **npm** installed.
```sh
npm install
```

### **3️⃣ Install LaTeX (Required for PDF Generation)**
Since `node-latex` requires LaTeX, install it based on your OS:
#### **Linux (Debian/Ubuntu)**:
```sh
sudo apt-get update && sudo apt-get install -y \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-extra-utils \
    texlive-latex-extra
```
#### **MacOS (using Homebrew)**:
```sh
brew install mactex
```
#### **Windows**:
1. Download & install [MiKTeX](https://miktex.org/download)
2. Ensure `pdflatex` is in your system PATH

### **4️⃣ Run the Server**
```sh
node index.js
```
By default, the server runs on `http://localhost:3000`.

## 🖥️ Deployment
For deployment, you can use **Render, DigitalOcean, or AWS**.

### **Deploy on Render (Using Docker)**
1. Create a `Dockerfile` (already included in the project)
2. Push to GitHub
3. Deploy as a **Docker Web Service** on Render

## 📝 Usage
1. Open `http://localhost:3000` in your browser.
2. Fill in the form with your details.
3. Choose a resume template.
4. Click **Generate PDF**.
5. Download your generated resume.

## 🔧 Troubleshooting
### **"Error: Unable to run pdflatex command"**
Ensure LaTeX (`pdflatex`) is installed and accessible from the command line.

### **Port Already in Use Error**
Modify `index.js` to use a different port:
```js
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## 🤝 Contributing
Pull requests are welcome! Feel free to fork the repo and submit improvements.

## 📜 License
This project is open-source and available under the **MIT License**.

