# 🔥 Firestore Database Setup Guide

## ⚠️ **חובה: הפעלת Firestore Database**

השגיאה `PERMISSION_DENIED` מצביעה על כך ש-Firestore Database לא הופעל עדיין.

### 📋 **שלבים להפעלת Firestore:**

#### 1. **פתח Firebase Console**
```
🔗 https://console.firebase.google.com/
```

#### 2. **בחר פרויקט**
```
📁 pci-payment-portal
```

#### 3. **הפעל Firestore Database**
- לחץ על **"Firestore Database"** בתפריט השמאלי
- לחץ על **"Create database"**
- בחר **"Start in test mode"** (לפיתוח)
- בחר מיקום: **"us-central1"** (או הקרוב ביותר)
- לחץ **"Done"**

#### 4. **הגדר Security Rules (אופציונלי)**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // For development, you can temporarily allow all access:
    // match /{document=**} {
    //   allow read, write: if true;
    // }
  }
}
```

### 🚀 **לאחר ההפעלה:**

#### **הרץ את הסקריפט שוב:**
```bash
npm run add-sample-data
```

#### **או עם JavaScript:**
```bash
npm run add-sample-data-js
```

### 📊 **הנתונים שיתווספו:**

1. **ABC123** - 2 נוסעים, $1160, Active (כל הפריטים לא שולמו)
2. **XYZ789** - 1 נוסע, $865, Active (כרטיס ומושב שולמו, מזוודה לא)
3. **DEF456** - 2 נוסעים, $1390, Completed (כל הפריטים שולמו)
4. **GHI012** - 1 נוסע, $445, Active (כל הפריטים לא שולמו)

### 🧪 **בדיקת הנתונים:**

#### **באפליקציה:**
1. פתח `http://localhost:3000`
2. השתמש ב-Reservation Loader
3. הכנס קוד הזמנה: `ABC123`, `XYZ789`, `DEF456`, או `GHI012`

#### **ב-Firebase Console:**
1. לך ל-Firestore Database
2. תראה collection בשם `reservations`
3. תראה 4 מסמכים עם הנתונים

### 🔧 **פתרון בעיות:**

#### **אם עדיין יש שגיאות הרשאות:**
1. ודא ש-Firestore Database הופעל
2. בדוק את Security Rules
3. ודא שהפרויקט נבחר נכון

#### **אם הסקריפט לא רץ:**
```bash
# התקן tsx אם חסר
npm install --save-dev tsx

# או השתמש ב-JavaScript version
npm run add-sample-data-js
```

### 📝 **הערות חשובות:**

- **Test Mode** מאפשר גישה מלאה למשך 30 יום
- **Production** דורש הגדרת Security Rules מתאימה
- הנתונים נשמרים בענן ויהיו זמינים מכל מכשיר

### ✅ **אימות הצלחה:**

אם הכל עובד, תראה:
```
🎉 All reservations added successfully!
📋 Summary of added reservations:
1. ABC123 - 2 passenger(s), $1160, Active
2. XYZ789 - 1 passenger(s), $865, Active
3. DEF456 - 2 passenger(s), $1390, Completed
4. GHI012 - 1 passenger(s), $445, Active
```

---

**🎯 לאחר השלמת השלבים האלה, מערכת ניהול ההזמנות תהיה מוכנה לשימוש מלא!**
