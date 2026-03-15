const fs = require('fs');

// --- 1. КЛАСС ОБЪЕКТА (Лаб 3) ---
class MobilePhone {
    constructor(imei, brand, model, price) {
        this.imei = imei;
        this.brand = brand;
        this.model = model;
        this.price = parseFloat(price) || 0;
    }

    // Расчет цены в разных валютах (Лаб 8 функционал)
    getConvertedPrice(currency) {
        const rates = { 'EUR': 20.0, 'USD': 18.5, 'RON': 4.0 };
        const rate = rates[currency] || 1;
        return (this.price / rate).toFixed(2);
    }
}

// --- 2. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
let phoneCollection = [];
let editIndex = null;
let sortDirection = 'none'; // 'asc', 'desc', 'none'

// --- 3. УПРАВЛЕНИЕ ТЕМОЙ (Авто/День/Ночь) ---
window.handleThemeChange = function() {
    const theme = document.getElementById('theme-select').value;
    const hour = new Date().getHours();
    
    let isDark = false;
    if (theme === 'night') isDark = true;
    else if (theme === 'day') isDark = false;
    else isDark = (hour >= 20 || hour < 6); // Auto

    document.body.classList.toggle('dark-theme', isDark);
};

// --- 4. ДОБАВЛЕНИЕ И РЕДАКТИРОВАНИЕ ---
window.handleAddPhone = function() {
    const imei = document.getElementById('imei').value;
    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model').value;
    const price = document.getElementById('price').value;

    if (!imei || !brand || !price) {
        alert("Пожалуйста, заполните все поля");
        return;
    }

    if (editIndex !== null) {
        // Редактируем существующий
        phoneCollection[editIndex] = new MobilePhone(imei, brand, model, price);
        editIndex = null;
        document.querySelector('.add-btn-ios').innerText = 'Добавить';
    } else {
        // Создаем новый
        phoneCollection.push(new MobilePhone(imei, brand, model, price));
    }
    
    saveAndRender();
    clearInputs();
};

window.startEdit = function(index) {
    const phone = phoneCollection[index];
    document.getElementById('imei').value = phone.imei;
    document.getElementById('brand').value = phone.brand;
    document.getElementById('model').value = phone.model;
    document.getElementById('price').value = phone.price;

    editIndex = index;
    document.querySelector('.add-btn-ios').innerText = 'Сохранить';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- 5. УДАЛЕНИЕ И НОТИФИКАЦИИ ---
window.deletePhone = function(index) {
    const phone = phoneCollection[index];
    if (confirm(`Вы уверены, что хотите удалить ${phone.brand} ${phone.model}?`)) {
        phoneCollection.splice(index, 1);
        
        // Системное уведомление
        new Notification('Управление телефонами', {
            body: `Объект ${phone.brand} успешно удален.`
        });

        saveAndRender();
    }
};

// --- 6. СОРТИРОВКА И ВАЛЮТА ---
window.toggleSort = function() {
    if (sortDirection === 'none' || sortDirection === 'desc') sortDirection = 'asc';
    else sortDirection = 'desc';
    
    const icon = sortDirection === 'asc' ? '🔼' : '🔽';
    document.getElementById('sort-icon').innerText = icon;
    renderList();
};

window.updateCurrency = function() {
    renderList();
};

// --- 7. СОХРАНЕНИЕ И ОТРИСОВКА (RENDER) ---
function saveAndRender() {
    try {
        fs.writeFileSync('phones.json', JSON.stringify(phoneCollection, null, 2));
    } catch (err) {
        console.error("Ошибка записи:", err);
    }
    renderList();
}

function renderList() {
    const listElement = document.getElementById('phone-list');
    const currency = document.getElementById('currency-select').value;
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const brandFilter = document.getElementById('brand-filter-select').value;
    
    if (!listElement) return;

    // Фильтрация
    let filtered = phoneCollection.filter(p => {
        const matchesSearch = p.brand.toLowerCase().includes(searchQuery) || 
                              p.model.toLowerCase().includes(searchQuery) ||
                              p.imei.includes(searchQuery);
        const matchesBrand = (brandFilter === 'all' || p.brand === brandFilter);
        return matchesSearch && matchesBrand;
    });

    // Сортировка
    if (sortDirection === 'asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortDirection === 'desc') {
        filtered.sort((a, b) => b.price - a.price);
    }

    listElement.innerHTML = filtered.length === 0 ? '<div class="empty-state">Ничего не найдено</div>' : '';

    let totalSum = 0;
    filtered.forEach((phone) => {
        totalSum += phone.price;
        const converted = phone.getConvertedPrice(currency);
        // Находим индекс в оригинальном массиве для кнопок
        const realIndex = phoneCollection.indexOf(phone);

        listElement.innerHTML += `
            <div class="phone-card">
                <div class="phone-info">
                    <span class="phone-main-text">${phone.brand} ${phone.model}</span>
                    <span class="phone-sub-text">
                        IMEI: ${phone.imei} | ${phone.price} MDL (${converted} ${currency})
                    </span>
                </div>
                <div class="action-buttons">
                    <button class="icon-btn edit-icon" onclick="window.startEdit(${realIndex})">✏️</button>
                    <button class="icon-btn delete-icon" onclick="window.deletePhone(${realIndex})">🗑️</button>
                </div>
            </div>
        `;
    });

    // Обновление статистики
    document.getElementById('total-count').innerText = filtered.length;
    document.getElementById('total-sum').innerText = totalSum.toLocaleString();
    
    updateBrandFilterOptions();
}

// Автозаполнение списка брендов
function updateBrandFilterOptions() {
    const select = document.getElementById('brand-filter-select');
    if (!select) return;
    const brands = [...new Set(phoneCollection.map(p => p.brand))];
    const currentValue = select.value;
    
    select.innerHTML = '<option value="all">Все бренды</option>';
    brands.forEach(b => {
        const selected = b === currentValue ? 'selected' : '';
        select.innerHTML += `<option value="${b}" ${selected}>${b}</option>`;
    });
}

function clearInputs() {
    ['imei', 'brand', 'model', 'price'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

// --- 8. ЗАГРУЗКА ПРИ СТАРТЕ ---
function init() {
    if (fs.existsSync('phones.json')) {
        try {
            const data = fs.readFileSync('phones.json', 'utf8');
            const parsed = JSON.parse(data);
            phoneCollection = parsed.map(p => new MobilePhone(p.imei, p.brand, p.model, p.price));
        } catch (e) {
            console.error("Ошибка загрузки данных:", e);
        }
    }
    window.handleThemeChange();
    renderList();
}

init();
