# TheoTown Money Field Type Guide

Panduan ini menjelaskan tipe data yang digunakan untuk menyimpan nilai uang (estate) dalam file save TheoTown.

## Ringkasan Tipe Data

| Type Byte | Nama | Ukuran | Rentang Nilai | Contoh Skenario |
|-----------|------|--------|---------------|-----------------|
| `0x0e` | Int16 | 2 bytes | 0 - 32,767 | Kota baru/early game |
| `0x08` | Int32 | 4 bytes | 0 - 2,147,483,647 | Kota menengah (~2.1B max) |
| `0x07` / `0x10` | Double | 8 bytes | 0 - ~1.8×10³⁰⁸ | Kota endgame dengan uang sangat banyak |

## Detail per Tipe Data

### 1. Int16 (Type `0x0e`)

**Spesifikasi:**
- Ukuran: 2 bytes (16-bit signed integer)
- Minimum: 0
- Maximum: 32,767 (~32.7K)

**Kapan TheoTown menggunakan tipe ini:**
- Saat kota pertama kali dibuat
- Ketika uang masih di bawah 32,767

**Contoh nilai valid:**
```
0
1,000
10,000
32,767    ← Maximum
```

**Limitasi Editor:**
- Jika mencoba memasukkan nilai > 32,767, akan di-clamp ke 32,767
- Untuk mendapatkan kapasitas lebih besar, mainkan game hingga uang > 32,767 agar TheoTown otomatis upgrade ke Int32

---

### 2. Int32 (Type `0x08`)

**Spesifikasi:**
- Ukuran: 4 bytes (32-bit signed integer)  
- Minimum: 0
- Maximum: 2,147,483,647 (~2.15B)

**Kapan TheoTown menggunakan tipe ini:**
- Setelah uang pernah melebihi 32,767 in-game
- Kota dengan ekonomi menengah

**Contoh nilai valid:**
```
0
1,000,000         (1 juta)
100,000,000       (100 juta)
1,000,000,000     (1 miliar)
2,147,483,647     ← Maximum (~2.15 miliar)
```

**Limitasi Editor:**
- Jika mencoba memasukkan nilai > 2,147,483,647, akan di-clamp ke 2,147,483,647
- Untuk mendapatkan kapasitas lebih besar, mainkan game hingga uang > 2,147,483,647 agar TheoTown otomatis upgrade ke Double

---

### 3. Double (Type `0x07` atau `0x10`)

**Spesifikasi:**
- Ukuran: 8 bytes (64-bit floating point)
- Minimum: 0
- Maximum: ~1.7976931348623157×10³⁰⁸

**Kapan TheoTown menggunakan tipe ini:**
- Setelah uang pernah melebihi 2,147,483,647 in-game
- Kota endgame dengan ekonomi sangat besar

**Contoh nilai valid:**
```
0
1,000,000,000,000           (1 triliun)
1,000,000,000,000,000       (1 kuadriliun)
1e18                         (1 quintillion, scientific notation)
1.5e20                       (150 quintillion, scientific notation)
9,007,199,254,740,991       (JavaScript MAX_SAFE_INTEGER)
1e100                        (Googol)
1e308                        (mendekati maximum)
```

**Catatan Penting untuk Double:**

⚠️ **Presisi Integer:**
- Untuk nilai integer > `9,007,199,254,740,991` (MAX_SAFE_INTEGER), presisi mulai berkurang
- Contoh: `9,007,199,254,740,993` mungkin tersimpan sebagai `9,007,199,254,740,992`
- Ini adalah limitasi format IEEE 754 double-precision floating-point

⚠️ **Scientific Notation:**
- Untuk nilai sangat besar, gunakan scientific notation: `1.5e15` = 1,500,000,000,000,000
- Editor akan menampilkan nilai > 10¹⁵ dalam scientific notation

---

## Cara Mengetahui Tipe Data di Editor

1. Buka file `.city` dengan TheoTown Save Editor
2. Lihat tooltip di field **Money** (hover "?")
3. Tooltip akan menunjukkan: `Binary: estate (Int16/Int32/Double64)`

## Test Cases untuk User

### Test Case 1: Kota dengan Int16 (baru/early game)
- **Input:** `25000`
- **Expected:** Tersimpan dan tampil sebagai `25,000`
- **Batas:** Max `32,767`

### Test Case 2: Kota dengan Int32 (mid game)
- **Input:** `1500000000` atau `1,500,000,000`
- **Expected:** Tersimpan dan tampil sebagai `1,500,000,000`
- **Batas:** Max `2,147,483,647`

### Test Case 3: Kota dengan Double (late game)
- **Input:** `5000000000000` atau `5e12` (5 triliun)
- **Expected:** Tersimpan dan tampil sebagai `5,000,000,000,000`
- **Batas:** Max ~`1.8e308`

### Test Case 4: Scientific Notation Input
- **Input:** `2.5e15`
- **Expected:** Tersimpan sebagai `2,500,000,000,000,000` (2.5 kuadriliun)

### Test Case 5: Input dengan Koma
- **Input:** `9,999,999,999`
- **Expected:** Koma diabaikan, tersimpan sebagai `9999999999`

### Test Case 6: Nilai di Atas MAX_SAFE_INTEGER (Double only)
- **Input:** `9007199254740992`
- **Expected:** Tersimpan (dengan catatan kemungkinan sedikit perubahan presisi)
- **Warning:** Presisi mungkin berkurang untuk integer sangat besar

---

## FAQ

### Q: Bagaimana cara upgrade dari Int16 ke Int32?
**A:** Mainkan game hingga uang Anda melebihi 32,767. TheoTown akan otomatis upgrade tipe data saat save.

### Q: Bagaimana cara upgrade dari Int32 ke Double?
**A:** Mainkan game hingga uang Anda melebihi 2,147,483,647 (~2.15B). TheoTown akan otomatis upgrade tipe data saat save.

### Q: Kenapa saya tidak bisa memasukkan nilai lebih dari 2.15B?
**A:** File save Anda masih menggunakan tipe Int32. Anda perlu upgrade tipe data dulu dengan cara di atas.

### Q: Apa itu scientific notation?
**A:** Format penulisan angka besar dengan eksponen. Contoh:
- `1e6` = 1,000,000 (1 juta)
- `1e9` = 1,000,000,000 (1 miliar)
- `1.5e12` = 1,500,000,000,000 (1.5 triliun)

---

## Catatan Teknis

TheoTown menggunakan Binary JSON format untuk menyimpan data. Setiap field memiliki:
1. **Type byte** - menentukan tipe data
2. **Value bytes** - nilai aktual

Editor tidak bisa mengubah tipe data karena akan merusak struktur Binary JSON. Upgrade tipe harus dilakukan oleh game TheoTown sendiri.
