# Learnfy

Learnfy is an interactive learning platform designed to make education engaging, simple, and accessible. It provides structured learning modules, resources, and a user-friendly interface for students and developers alike. The project serves as a foundation for building scalable e-learning solutions with modern technologies.

---

## 🚀 Features

* 📚 **Organized Learning** – Access structured modules and lessons.
* 🎯 **Interactive Experience** – Simple, responsive UI for smooth navigation.
* 🛠️ **Customizable** – Extend or adapt it for your own learning projects.
* 🌐 **Web-based** – Runs locally on your machine with minimal setup.

---

## 🛠️ Tech Stack

* **Backend:** Python (Flask)
* **Frontend:** HTML, CSS, JavaScript (with TailwindCSS integration possible)
* **Templating:** Jinja2
* **Data Storage:** JSON-based storage (lightweight alternative to DB)
* **Others:** Flask-CORS, dotenv, requests

---

## 📂 Project Structure

```
learnfy/
│-- app.py              # Main Flask application
│-- requirements.txt    # Python dependencies
│-- .env                # Environment variables
│-- static/             # Static files (CSS, JS, images)
│-- templates/          # HTML templates
│-- data/               # JSON files for content storage
│-- README.md           # Project documentation
```

---

## ⚙️ Installation

1. **Clone the repository**

```bash
git clone https://github.com/coderspree19/learnfy.git
cd learnfy
```

2. **Create a virtual environment**

```bash
python -m venv venv
source venv/bin/activate   # On Linux/Mac
venv\Scripts\activate      # On Windows
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Set up environment variables**

* Create a `.env` file in the root directory.
* Add necessary keys (API keys, secret key, etc.):

```
SECRET_KEY=your_secret_key
```

5. **Run the application**

```bash
python app.py
```


## 🖥️ Usage

* Navigate through the web app.
* Explore different learning modules.
* Modify `data/` JSON files to add your own content.

---

