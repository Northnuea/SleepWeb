# 💤 Sleepsense  
🌐 Live Demo: https://sleepsense.netlify.app/

---

## 📌 Overview
Sleepsense is a web-based dashboard application designed to analyze sleep disorder data and visualize relationships between sleep-related factors.

The system focuses on identifying correlations between:
- Sleep Duration
- Stress Level
- BMI
- Physical Activity
- Heart Rate
- Sleep Quality

The goal is to transform raw sleep data into meaningful insights using interactive dashboards.

---


### 📊 Dataset 
https://www.kaggle.com/datasets/uom190346a/sleep-health-and-lifestyle-dataset

### 🧾 Key Features (Columns)

| Feature | Description |
|----------|-------------|
| Age | Age of individual |
| Gender | Male / Female |
| Occupation | Job category |
| Sleep Duration | Average hours of sleep per night |
| Sleep Quality | Sleep quality score (1–10) |
| Physical Activity Level | Activity intensity score |
| Stress Level | Self-reported stress score |
| BMI Category | Underweight / Normal / Overweight / Obese |
| Heart Rate | Resting heart rate |
| Systolic BP | Systolic blood pressure |
| Diastolic BP | Diastolic blood pressure |
| Sleep Disorder | None / Insomnia / Sleep Apnea |

### 🎯 Dataset Purpose
The dataset enables:
- Correlation analysis between lifestyle and sleep
- Health risk pattern identification
- Sleep disorder distribution analysis

---

## 🎯 Objectives
- Analyze patterns related to sleep disorders
- Identify correlations between lifestyle and sleep quality
- Visualize trends using dashboard components
- Support data-driven health insights

---

## 📊 Dashboard Features

### 1️⃣ Overview Panel
- Total Records
- Average Sleep Duration
- Average Sleep Quality
- Average Stress Level
- Distribution of Sleep Disorders

### 2️⃣ Correlation Analysis
- Sleep Duration vs Stress Level
- BMI vs Sleep Disorder
- Physical Activity vs Sleep Quality
- Stress Level vs Sleep Quality
- Blood Pressure vs Sleep Disorder

### 3️⃣ Interactive Filters
- Gender
- Age Range
- Disorder Type
- BMI Category

---

## 🔎 Data Relationships Explored

| Factor 1 | Factor 2 | Relationship Observed |
|----------|----------|----------------------|
| Stress Level | Sleep Duration | Negative correlation |
| Stress Level | Sleep Quality | Negative correlation |
| BMI | Sleep Disorder | Higher BMI associated with higher disorder rate |
| Physical Activity | Sleep Quality | Positive correlation |
| Sleep Disorder | Blood Pressure | Higher BP observed in disorder cases |
| Age | Sleep Duration | Decrease in sleep duration with age |

---

## 🛠 Technologies Used

- 📊 [Microsoft Excel](https://1drv.ms/x/c/d9fd878c81c467a8/EaHZoXrf-_dBu5CuCDUd7FABeJuEw0wCcfz2xnwqXhp30A?e=eLAQIt) – Data preprocessing and cleaning  
- 🌐 [Web] – Structure   
- 🎨 [Figma](https://www.figma.com/design/Lodrx2FXTsYhwdZiMrt7Y5/Data-Analysis?node-id=0-1&p=f) – UI/UX Design  
- 📈 [Power BI] – Dashboard visualization  
- 🚀 [Netlify] – Deployment platform  

---

## 📈 Key Insights

- High stress levels significantly reduce both sleep duration and sleep quality.
- Individuals in higher BMI categories show higher incidence of Sleep Apnea.
- Increased physical activity is associated with better sleep quality.
- Sleep disorder cases show higher average blood pressure.
