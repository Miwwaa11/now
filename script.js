// Data untuk pesanan
const dummyData = {
  orders: {
    "FL2024001": {
      status: "washing",
      customer: "John Doe",
      service: "Laundry Kiloan",
      weight: "3 kg",
      total: "Rp 24.000",
      timeline: [
        { status: "received", time: "2024-01-15 10:00", description: "Pesanan diterima" },
        { status: "washing", time: "2024-01-15 10:30", description: "Sedang dicuci" }
      ]
    },
    "FL2024002": {
      status: "completed",
      customer: "Jane Smith",
      service: "Cuci & Setrika",
      weight: "5 kg",
      total: "Rp 50.000",
      timeline: [
        { status: "received", time: "2024-01-14 09:00", description: "Pesanan diterima" },
        { status: "washing", time: "2024-01-14 10:00", description: "Sedang dicuci" },
        { status: "ironing", time: "2024-01-14 14:00", description: "Disetrika" },
        { status: "delivery", time: "2024-01-15 08:00", description: "Dalam pengiriman" },
        { status: "completed", time: "2024-01-15 10:00", description: "Selesai" }
      ]
    },
    "FL2024003": {
      status: "received",
      customer: "Ahmad Budi",
      service: "Laundry Sepatu",
      weight: "2 pcs",
      total: "Rp 50.000",
      timeline: [
        { status: "received", time: "2024-01-16 08:00", description: "Pesanan diterima" }
      ]
    }
  }
};

// Performance optimization: Debounce function for scroll and resize events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Global Variables
let map;
let currentOrderStatus = '';
let lastMessageTime = 0;
const MESSAGE_COOLDOWN = 1000; // 1 second cooldown between messages

// Chat context untuk conversation flow
const chatContext = {
  lastQuestion: '',
  userIntent: '',
  conversationStep: 0,
  awaitingServiceType: false,
  awaitingPickupTime: false
};

// Data untuk chat bot
const chatBotData = {
  greetings: ['halo', 'hai', 'hi', 'hello', 'selamat', 'pagi', 'siang', 'sore', 'malam', 'hey'],
  pricing: ['harga', 'biaya', 'tarif', 'berapa', 'mahal', 'murah', 'price', 'cost'],
  services: ['layanan', 'service', 'jenis', 'apa saja', 'cuci', 'laundry', 'services', 'paket'],
  timing: ['jam', 'waktu', 'lama', 'cepat', 'berapa lama', 'durasi', 'estimasi'],
  location: ['lokasi', 'dimana', 'alamat', 'outlet', 'cabang', 'tempat', 'address'],
  tracking: ['lacak', 'track', 'status', 'pesanan', 'order', 'kiriman', 'tracking'],
  contact: ['kontak', 'hubungi', 'telepon', 'wa', 'whatsapp', 'call', 'cs', 'customer service'],
  reservation: ['pesan', 'booking', 'reservasi', 'order', 'pickup', 'jemput', 'antar']
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();

  // Fallback: Re-initialize review stars after a delay to ensure DOM is ready
  setTimeout(function() {
    const stars = document.querySelectorAll('.star');
    if (stars.length > 0) {
      console.log('🔄 Re-initializing review stars as fallback');
      initializeReviewStars();
    }
  }, 500);
});
  // Fallback for broken payment logos (replace with inline SVG placeholder)
  document.addEventListener('DOMContentLoaded', function(){
    const imgs = document.querySelectorAll('.payment-logo img');
    imgs.forEach(img => {
      img.addEventListener('error', function() {
        // small neutral placeholder SVG
        const placeholderSVG = `
          <svg xmlns='http://www.w3.org/2000/svg' width='140' height='72'>
            <rect width='100%' height='100%' fill='#f6f6f6'/>
            <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#999' font-family='Arial, sans-serif' font-size='14'>Logo</text>
          </svg>`;
        this.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(placeholderSVG);
        this.classList.add('broken');
        console.warn('Payment logo failed to load, using placeholder for', this.closest('.payment-item')?.dataset?.method || 'unknown');
      });
      // small improvement: add alt text from data-method if missing
      if (!img.getAttribute('alt')) {
        const method = img.closest('.payment-item')?.dataset?.method;
        if (method) img.setAttribute('alt', method);
      }
    });
  });

// Copy contact form into reservation form to avoid duplicate reservations
(function(){
  var contactForm = document.getElementById('contactForm');
  var reservationForm = document.getElementById('reservationForm');
  if (!contactForm || !reservationForm) return;

  contactForm.addEventListener('submit', function(e){
    // If the user is already submitting contact form, instead populate reservation form and scroll there
    e.preventDefault();

    try {
      var nameEl = document.getElementById('contactName');
      var phoneEl = document.getElementById('contactPhone');
      var emailEl = document.getElementById('contactEmail');
      var serviceEl = document.getElementById('contactService');
      var messageEl = document.getElementById('contactMessage');

      var name = nameEl ? nameEl.value.trim() : '';
      var phone = phoneEl ? phoneEl.value.trim() : '';
      var email = emailEl ? emailEl.value.trim() : '';
      var service = serviceEl ? serviceEl.value : '';
      var message = messageEl ? messageEl.value.trim() : '';

      // populate reservation form fields
      if (name && document.getElementById('customerName')) document.getElementById('customerName').value = name;
      if (phone && document.getElementById('customerPhone')) document.getElementById('customerPhone').value = phone;
      if (service && document.getElementById('serviceType')) document.getElementById('serviceType').value = service;
      if (message && document.getElementById('specialInstructions')) document.getElementById('specialInstructions').value = message;

      // Scroll to reservation section
      var target = document.getElementById('reservasi');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Notify user
      showToast('Data kontak dipindahkan ke formulir Reservasi. Lengkapi alamat & tanggal jemput untuk menyelesaikan pesanan.');
    } catch (err) {
      console.error('Error moving contact to reservation', err);
      showToast('Terjadi kesalahan. Silakan isi formulir Reservasi secara manual.', 'error');
    }
  });
})();

// Initialize Application
function initializeApp() {
  // Loading spinner removed: no need to hide

  // Initialize components
  initializeEventListeners();
  loadOutletData();
  initializeServiceFilters();
  initializeDateInputs();
  initializeChatBot();
  initializeSmoothScrolling();

  // Add quick options after a short delay
  setTimeout(addQuickOptionsToLatestMessage, 500);

  // Load any saved chat history
  loadChatFromLocalStorage();
}

// Initialize Event Listeners
function initializeEventListeners() {
  // Back to top button
  window.addEventListener('scroll', debounce(handleScroll, 10));
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', scrollToTop);
  }

  // Form submissions
  const reservationForm = document.getElementById('reservationForm');
  if (reservationForm) {
    reservationForm.addEventListener('submit', handleReservation);
  }

  // FAQ functionality
  initializeFAQ();

  // Review stars
  initializeReviewStars();

  // Close modals
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
      closeAllModals();
    }
  });

  // Service order buttons
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-order')) {
      const service = e.target.getAttribute('data-service');
      scrollToReservation();

      // Set the service type in reservation form
      setTimeout(() => {
        const serviceSelect = document.getElementById('serviceType');
        if (serviceSelect) {
          serviceSelect.value = service;
        }
      }, 500);
    }
  });

  // Chat functionality
  const chatToggle = document.getElementById('chatToggle');
  if (chatToggle) {
    chatToggle.addEventListener('click', toggleChat);
  }

  const closeChat = document.getElementById('closeChat');
  if (closeChat) {
    closeChat.addEventListener('click', toggleChat);
  }

  const sendMessage = document.getElementById('sendMessage');
  if (sendMessage) {
    sendMessage.addEventListener('click', sendChatMessage);
  }

  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendChatMessage();
    });
  }

  // Quick options in chat
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('quick-option')) {
      const message = e.target.getAttribute('data-message');
      if (message) {
        quickOptionClick(message);
      }
    }
  });

  // Mobile dropdown menu handling
  document.addEventListener('click', function(e) {
    const link = e.target.closest && e.target.closest('.menu-item .menu-link');
    if (link && window.innerWidth <= 900) {
      e.preventDefault();
      const menuItem = link.closest('.menu-item');
      if (!menuItem) return;
      const dropdown = menuItem.querySelector('.dropdown-menu');
      if (!dropdown) return;
      // Toggle visibility
      const isOpen = dropdown.style.display === 'block';
      // Close other dropdowns
      document.querySelectorAll('.dropdown-menu').forEach(d => d.style.display = 'none');
      dropdown.style.display = isOpen ? 'none' : 'block';
    } else {
      // Click outside => close mobile dropdowns
      if (!e.target.closest || !e.target.closest('.menu-item')) {
        if (window.innerWidth <= 900) {
          document.querySelectorAll('.dropdown-menu').forEach(d => d.style.display = 'none');
        }
      }
    }
  });

  // Desktop dropdown menu handling - for toggling on click
  document.addEventListener('click', function(e) {
    const link = e.target.closest && e.target.closest('.menu-item .menu-link');
    const dropdownMenu = e.target.closest && e.target.closest('.dropdown-menu');

    if (link && window.innerWidth > 900) {
      e.preventDefault();
      const menuItem = link.closest('.menu-item');
      if (!menuItem) return;
      const dropdown = menuItem.querySelector('.dropdown-menu');
      if (!dropdown) return;
      // Toggle visibility
      const isOpen = dropdown.style.display === 'block';
      // Close other dropdowns
      document.querySelectorAll('.dropdown-menu').forEach(d => d.style.display = 'none');
      dropdown.style.display = isOpen ? 'none' : 'block';
    } else if (!dropdownMenu && window.innerWidth > 900) {
      // Click outside the dropdown menu => close desktop dropdowns
      document.querySelectorAll('.dropdown-menu').forEach(d => d.style.display = 'none');
    }
  });

  // Price calculator - result section visible but don't auto-calculate
  // Calculation only happens when user clicks "Hitung Harga" button

  // Tracking form
  const trackingInput = document.getElementById('trackingInput');
  if (trackingInput) {
    trackingInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') trackOrder();
    });
  }
}

// Scroll Handlers
function handleScroll() {
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    if (window.pageYOffset > 300) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }
  }
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function scrollToReservation() {
  const reservasiSection = document.getElementById('reservasi');
  if (reservasiSection) {
    reservasiSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// Initialize smooth scrolling for navigation links
function initializeSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      // Skip if href is just '#' or empty
      if (!href || href === '#' || href.length <= 1) {
        return;
      }
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Toast Notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = 'toast show';

  // Set background color based on type
  if (type === 'error') {
    toast.style.background = '#e74c3c';
  } else if (type === 'warning') {
    toast.style.background = '#f39c12';
  } else {
    toast.style.background = 'var(--primary-color)';
  }

  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Order Tracking Functions
async function trackOrder() {
  try {
    console.log('trackOrder() called');

    const trackingInput = document.getElementById('trackingInput');
    const trackingResult = document.getElementById('trackingResult');

    console.log('trackingInput:', trackingInput);
    console.log('trackingResult:', trackingResult);

    if (!trackingInput || !trackingResult) {
      console.error('Elements not found!');
      return;
    }

    const searchValue = trackingInput.value.trim();
    console.log('Search value:', searchValue);

    if (!searchValue) {
      showToast('Masukkan kode pesanan atau nomor HP terlebih dahulu', 'warning');
      return;
    }

    // Show loading
    trackingResult.innerHTML = `
      <div class="tracking-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Mencari data pesanan...</p>
      </div>
    `;
    // Determine if input is order number or phone
    const isOrderNumber = searchValue.toUpperCase().startsWith('FL-');
    const params = isOrderNumber
      ? `orderNumber=${encodeURIComponent(searchValue.toUpperCase())}`
      : `phone=${encodeURIComponent(searchValue)}`;

    const response = await fetch(`/api/orders/track?${params}`);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const data = await response.json();
    console.log('Track response:', data);
    console.log('data.success:', data.success);
    console.log('data.data:', data.data);

    if (response.ok && data.success && data.data) {
      console.log('Calling displayOrderTracking...');
      displayOrderTracking(data.data);
      console.log('Calling updateTrackingSteps...');
      updateTrackingSteps(data.data.status);
      console.log('Done!');
    } else {
      console.log('Order not found or error');
      trackingResult.innerHTML = `
        <div class="tracking-error">
          <i class="fas fa-exclamation-triangle"></i>
          <h4>Pesanan Tidak Ditemukan</h4>
          <p>Tidak ada pesanan dengan <strong>${searchValue}</strong></p>
          <p>Silakan periksa kembali atau hubungi customer service.</p>
          <p class="text-xs text-gray-500 mt-2">Debug: success=${data.success}, hasData=${!!data.data}</p>
        </div>
      `;
      resetTrackingSteps();
    }
  } catch (error) {
    console.error('Error tracking order:', error);
    trackingResult.innerHTML = `
      <div class="tracking-error">
        <i class="fas fa-exclamation-circle"></i>
        <h4>Terjadi Kesalahan</h4>
        <p>Tidak dapat terhubung ke server. Silakan coba lagi.</p>
      </div>
    `;
    resetTrackingSteps();
  }
}

function displayOrderTracking(orderData) {
  const trackingResult = document.getElementById('trackingResult');
  if (!trackingResult) return;

  console.log('Displaying order:', orderData); // Debug

  const statusText = {
    'pesanan_diterima': 'Pesanan Diterima',
    'dalam_pencucian': 'Dalam Pencucian',
    'disetrika': 'Disetrika',
    'dalam_pengiriman': 'Dalam Pengiriman',
    'selesai': 'Selesai'
  };

  const statusDescriptions = {
    'pesanan_diterima': 'Pesanan Anda telah kami terima dan sedang diproses',
    'dalam_pencucian': 'Pakaian Anda sedang dalam proses pencucian',
    'disetrika': 'Pakaian Anda sedang disetrika dan dipacking',
    'dalam_pengiriran': 'Pesanan Anda sedang dalam perjalanan ke alamat Anda',
    'selesai': 'Pesanan telah selesai dan siap diambil'
  };

  const serviceName = orderData.service?.name || 'Layanan Laundry';
  const totalPrice = orderData.finalTotal || orderData.totalPrice || 0;
  const customerName = orderData.customerName || orderData.customer?.name || 'Pelanggan';
  const orderNumber = orderData.orderNumber || orderData.id;
  const createdDate = orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '-';

  trackingResult.innerHTML = `
    <div class="tracking-success">
      <div class="order-header">
        <div>
          <h4>Pesanan #${orderNumber}</h4>
          <p class="customer-name">${customerName}</p>
        </div>
        <span class="status-badge ${orderData.status}">${statusText[orderData.status]}</span>
      </div>

      <div class="status-description">
        <p>${statusDescriptions[orderData.status]}</p>
      </div>

      <div class="order-details">
        <div class="detail-item">
          <span>Layanan:</span>
          <span>${serviceName}</span>
        </div>
        <div class="detail-item">
          <span>Alamat:</span>
          <span>${orderData.address || 'Ambil di tempat'}</span>
        </div>
        <div class="detail-item">
          <span>Total Biaya:</span>
          <span class="price">Rp ${Number(totalPrice).toLocaleString('id-ID')}</span>
        </div>
        <div class="detail-item">
          <span>Tanggal Pesan:</span>
          <span>${createdDate}</span>
        </div>
      </div>

      <div class="tracking-actions">
        <button class="btn-secondary" onclick="contactAboutOrder('${orderNumber}')">
          <i class="fas fa-headset"></i>
          Tanya Pesanan Ini
        </button>
      </div>
    </div>
  `;
}

function contactAboutOrder(orderCode) {
  const message = `Halo Family Laundry, saya ingin bertanya tentang pesanan #${orderCode}. Bisa dibantu?`;
  window.open(`https://wa.me/6285745198337?text=${encodeURIComponent(message)}`, '_blank');
}

function updateTrackingSteps(status) {
  const steps = document.querySelectorAll('.step');
  const statusOrder = ['pesanan_diterima', 'dalam_pencucian', 'disetrika', 'dalam_pengiriman', 'selesai'];
  const currentIndex = statusOrder.indexOf(status);

  steps.forEach((step, index) => {
    step.classList.remove('active');
    if (index <= currentIndex) {
      step.classList.add('active');
    }
  });
}

function resetTrackingSteps() {
  const steps = document.querySelectorAll('.step');
  steps.forEach(step => step.classList.remove('active'));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Form Handlers
function handleReservation(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('customerName').value,
    address: document.getElementById('customerAddress').value,
    phone: document.getElementById('customerPhone').value,
    service: document.getElementById('serviceType').value,
    date: document.getElementById('pickupDate').value,
    time: document.getElementById('pickupTime').value,
    instructions: document.getElementById('specialInstructions').value
  };

  // Validate form
  const errors = validateReservationForm(formData);
  if (errors.length > 0) {
    showToast(errors[0], 'error');
    return;
  }

  // Simulate form submission
  showToast('Reservasi berhasil! Driver kami akan menghubungi Anda dalam 15 menit.', 'success');

  // Reset form
  e.target.reset();
  initializeDateInputs();

  // Send WhatsApp notification
  sendWhatsAppNotification(formData);
}

function validateReservationForm(formData) {
  const errors = [];

  if (!formData.name.trim()) {
    errors.push('Nama lengkap harus diisi');
  }

  if (!formData.address.trim()) {
    errors.push('Alamat lengkap harus diisi');
  }

  if (!validatePhone(formData.phone)) {
    errors.push('Nomor WhatsApp harus diisi dengan format yang benar');
  }

  if (!formData.service) {
    errors.push('Pilih jenis layanan');
  }

  if (!formData.date) {
    errors.push('Pilih tanggal pickup');
  }

  if (!formData.time) {
    errors.push('Pilih waktu pickup');
  }

  return errors;
}

function validatePhone(phone) {
  const phoneRegex = /^[0-9+\-\s()]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function sendWhatsAppNotification(formData) {
  const phone = '6285745198337';
  const serviceText = document.getElementById('serviceType').options[document.getElementById('serviceType').selectedIndex].text;

  const message = `Halo Family Laundry! Saya mau pesan laundry:

📋 Detail Pesanan:
• Nama: ${formData.name}
• Alamat: ${formData.address}
• WhatsApp: ${formData.phone}
• Layanan: ${serviceText}
• Tanggal Jemput: ${formData.date}
• Waktu Jemput: ${formData.time}

${formData.instructions ? `📝 Instruksi Khusus:\n${formData.instructions}` : ''}

Mohon konfirmasi pesanan saya. Terima kasih!`;

  // For demo purposes, we'll show a confirmation
  setTimeout(() => {
    if (confirm('Buka WhatsApp untuk konfirmasi pesanan ke Customer Service?')) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  }, 1000);
}

// Service Filters
function initializeServiceFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const serviceItems = document.querySelectorAll('.layanan-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');

      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Filter services with animation
      serviceItems.forEach(item => {
        if (filter === 'all' || item.getAttribute('data-category') === filter) {
          item.style.display = 'block';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          }, 100);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'translateY(20px)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

// FAQ Functions
function initializeFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    if (question) {
      question.addEventListener('click', () => {
        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
          }
        });

        // Toggle current item
        item.classList.toggle('active');
      });
    }
  });
}

// Review System
function initializeReviewStars() {
  const stars = document.querySelectorAll('.star');
  const ratingText = document.getElementById('ratingText');

  if (stars.length === 0) {
    console.warn('⚠️ Review stars not found in DOM');
    return;
  }

  console.log('✅ Initializing', stars.length, 'review stars');

  stars.forEach((star, index) => {
    // Remove any existing listeners
    const newStar = star.cloneNode(true);
    star.parentNode.replaceChild(newStar, star);

    newStar.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const rating = this.getAttribute('data-rating');
      console.log('⭐ Star clicked:', rating, 'Element:', this);
      updateStarRating(rating);
    });

    newStar.addEventListener('mouseover', function() {
      const rating = this.getAttribute('data-rating');
      highlightStars(rating);
    });

    newStar.addEventListener('mouseout', function() {
      const activeRating = document.querySelector('.star.active')?.getAttribute('data-rating') || '0';
      highlightStars(activeRating);
    });
  });

  console.log('✅ Review stars initialization complete');
}

function updateStarRating(rating) {
  const stars = document.querySelectorAll('.star');
  const ratingText = document.getElementById('ratingText');

  // Update stars - remove inline styles first
  stars.forEach(s => {
    s.style.color = ''; // Clear inline style
    if (s.getAttribute('data-rating') <= rating) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });

  // Update rating text
  const ratings = {
    '1': 'Tidak Puas',
    '2': 'Kurang Puas',
    '3': 'Cukup Puas',
    '4': 'Puas',
    '5': 'Sangat Puas'
  };

  if (ratingText) {
    ratingText.textContent = ratings[rating];
  }

  console.log('✅ Rating updated to:', rating, '-', ratings[rating]);
}

function highlightStars(rating) {
  const stars = document.querySelectorAll('.star');
  stars.forEach(s => {
    const starRating = s.getAttribute('data-rating');
    if (starRating <= rating) {
      if (!s.classList.contains('active')) {
        s.style.color = '#ffc107'; // Only for hover preview
      }
    } else {
      if (!s.classList.contains('active')) {
        s.style.color = '#ddd';
      }
    }
  });
}

function submitReview() {
  const activeStars = document.querySelectorAll('.star.active');
  const reviewText = document.getElementById('reviewText');
  const reviewerName = document.getElementById('reviewerName');

  if (!reviewText) return;

  const reviewTextValue = reviewText.value.trim();
  const reviewerNameValue = reviewerName ? reviewerName.value.trim() : 'Pelanggan';
  const rating = activeStars.length;

  if (activeStars.length === 0) {
    showToast('Silakan beri rating terlebih dahulu', 'warning');
    return;
  }

  if (!reviewTextValue) {
    showToast('Silakan tulis review Anda', 'warning');
    return;
  }

  // Simulate review submission
  showToast('Terima kasih atas review Anda!', 'success');

  // Reset form
  resetReviewForm();

  // In real implementation, send to backend
  console.log('Review Submitted:', {
    rating: rating,
    review: reviewTextValue,
    name: reviewerNameValue,
    timestamp: new Date().toISOString()
  });
}

function resetReviewForm() {
  document.querySelectorAll('.star').forEach(star => {
    star.classList.remove('active');
    star.style.color = '#ddd';
  });

  const ratingText = document.getElementById('ratingText');
  if (ratingText) {
    ratingText.textContent = 'Pilih rating';
  }

  const reviewText = document.getElementById('reviewText');
  if (reviewText) {
    reviewText.value = '';
  }

  const reviewerName = document.getElementById('reviewerName');
  if (reviewerName) {
    reviewerName.value = '';
  }
}

// Price Calculator
function calculatePrice() {
  const serviceType = document.getElementById('calcServiceType');
  const weight = document.getElementById('calcWeight');

  if (!serviceType || !weight) return;

  const pricePerUnit = parseInt(serviceType.value);
  const quantity = parseFloat(weight.value) || 0;

  if (quantity <= 0) {
    showToast('Masukkan berat atau jumlah yang valid', 'warning');
    return;
  }

  const total = pricePerUnit * quantity;

  // Update display
  updatePriceDisplay(pricePerUnit, quantity, total);

  // Show result section with animation
  const calcResult = document.getElementById('calcResult');
  if (calcResult) {
    calcResult.style.display = 'block';
    calcResult.style.opacity = '0';
    calcResult.style.transform = 'translateY(20px)';

    setTimeout(() => {
      calcResult.style.opacity = '1';
      calcResult.style.transform = 'translateY(0)';
    }, 100);
  }
}

function updatePriceDisplay(pricePerUnit, quantity, total) {
  const serviceTypeText = document.getElementById('serviceTypeText');
  const weightText = document.getElementById('weightText');
  const subtotalPrice = document.getElementById('subtotalPrice');
  const totalPrice = document.getElementById('totalPrice');

  if (serviceTypeText) {
    serviceTypeText.textContent = document.getElementById('calcServiceType').options[document.getElementById('calcServiceType').selectedIndex].text.split(' - ')[0];
  }

  if (weightText) {
    const serviceType = document.getElementById('calcServiceType');
    const isPerKg = serviceType.value <= 10000; // Assuming services <= 10,000 are per kg
    weightText.textContent = isPerKg ? `${quantity} kg` : `${quantity} pcs`;
  }

  if (subtotalPrice) {
    subtotalPrice.textContent = formatCurrency(total);
  }

  if (totalPrice) {
    totalPrice.textContent = formatCurrency(total);
  }
}

function formatCurrency(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

// Outlet Functions
function loadOutletData() {
  // Data outlet tetap
  const outlet = {
    name: "Family Laundry Tulungagung",
    address: "Jl. Trunojoyo, Tebokan, Boro, Kec. Kedungwaru\nKabupaten Tulungagung, Jawa Timur 66229",
    hours: "Setiap Hari: 07:00 - 22:00 WIB",
    phone: "0857-4519-8337",
    whatsapp: "0857-4519-8337",
    features: [
      { icon: "fas fa-shuttle-van", text: "Gratis Antar Jemput" },
      { icon: "fas fa-parking", text: "Parkir Luas" },
      { icon: "fas fa-clock", text: "Buka Setiap Hari" }
    ]
  };

  // Update outlet info in the HTML
  const outletName = document.querySelector('.outlet-details h3');
  if (outletName) {
    outletName.textContent = outlet.name;
  }

  const outletAddress = document.querySelector('.outlet-address span');
  if (outletAddress) {
    outletAddress.innerHTML = outlet.address.replace('\n', '<br>');
  }

  const outletHours = document.querySelector('.outlet-hours span');
  if (outletHours) {
    outletHours.textContent = outlet.hours;
  }

  const outletPhone = document.querySelector('.outlet-phone span');
  if (outletPhone) {
    outletPhone.textContent = outlet.phone;
  }

  const outletWhatsapp = document.querySelector('.outlet-whatsapp span');
  if (outletWhatsapp) {
    outletWhatsapp.textContent = outlet.whatsapp;
  }

  // Update features
  const featuresContainer = document.querySelector('.outlet-features');
  if (featuresContainer) {
    featuresContainer.innerHTML = outlet.features.map(feature => `
      <div class="feature">
        <i class="${feature.icon}"></i>
        <span>${feature.text}</span>
      </div>
    `).join('');
  }
}

// Modal Functions
function showLoyaltyModal() {
  const loyaltyModal = document.getElementById('loyaltyModal');
  if (loyaltyModal) {
    loyaltyModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('active');
  });
  document.body.style.overflow = '';
}

// Date Input Initialization
function initializeDateInputs() {
  const today = new Date().toISOString().split('T')[0];
  const pickupDate = document.getElementById('pickupDate');

  // Set min date to today
  if (pickupDate) {
    pickupDate.min = today;

    // Set default to today if not already set
    if (!pickupDate.value) {
      pickupDate.value = today;
    }
  }

  // Set min time to current time for today, or 07:00 for future dates
  const pickupTime = document.getElementById('pickupTime');
  if (pickupTime) {
    const selectedDate = pickupDate ? pickupDate.value : today;
    const now = new Date();
    const isToday = selectedDate === today;

    if (isToday) {
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
                         now.getMinutes().toString().padStart(2, '0');
      pickupTime.min = currentTime;

      // Set default to 30 minutes from now if not set
      if (!pickupTime.value) {
        pickupTime.value = addMinutesToTime(currentTime, 30);
      }
    } else {
      pickupTime.min = '07:00';

      // Set default to 08:00 if not set
      if (!pickupTime.value) {
        pickupTime.value = '08:00';
      }
    }
  }
}

function addMinutesToTime(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(mins + minutes);

  return date.getHours().toString().padStart(2, '0') + ':' +
         date.getMinutes().toString().padStart(2, '0');
}

// Chat Functions
function initializeChatBot() {
  // Set current time for initial message
  updateChatTime();

  // Load any previous chat context
  const savedContext = localStorage.getItem('chatContext');
  if (savedContext) {
    Object.assign(chatContext, JSON.parse(savedContext));
  }
}

function updateChatTime() {
  const now = new Date();
  const timeString = now.getHours().toString().padStart(2, '0') + ':' +
                     now.getMinutes().toString().padStart(2, '0');
  const currentTimeElement = document.getElementById('currentTime');
  if (currentTimeElement) {
    currentTimeElement.textContent = timeString;
  }
}

function toggleChat() {
  const chatWidget = document.getElementById('liveChatWidget');
  const chatToggle = document.getElementById('chatToggle');

  if (chatWidget && chatToggle) {
    if (chatWidget.classList.contains('active')) {
      chatWidget.classList.remove('active');
      const notificationBadge = chatToggle.querySelector('.notification-badge');
      if (notificationBadge) {
        notificationBadge.style.display = 'none';
      }
    } else {
      chatWidget.classList.add('active');
      const notificationBadge = chatToggle.querySelector('.notification-badge');
      if (notificationBadge) {
        notificationBadge.style.display = 'flex';
      }
      // Focus on input when opening
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        setTimeout(() => chatInput.focus(), 300);
      }
    }
  }
}

function sendChatMessage() {
  if (!canSendMessage()) {
    showToast('Tunggu sebentar sebelum mengirim pesan lagi', 'warning');
    return;
  }

  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  if (!chatInput || !chatMessages) return;

  const message = chatInput.value.trim();

  if (message) {
    // Add user message
    addChatMessage('user', message);
    chatInput.value = '';

    // Update chat context
    updateChatContext(message);

    // Simulate bot response after 1-2 seconds
    setTimeout(() => {
      const botResponse = generateBotResponse(message);
      addChatMessage('bot', botResponse);

      // Save chat to localStorage
      saveChatToLocalStorage();

      // Show WhatsApp option if appropriate
      if (shouldShowWhatsAppOption(message)) {
        showWhatsAppOption();
      }

      // Add quick options to the latest bot message
      addQuickOptionsToLatestMessage();
    }, 1000 + Math.random() * 1000);
  }
}

function canSendMessage() {
  const now = Date.now();
  if (now - lastMessageTime < MESSAGE_COOLDOWN) {
    return false;
  }
  lastMessageTime = now;
  return true;
}

function addChatMessage(type, message) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;

  updateChatTime();
  const currentTimeElement = document.getElementById('currentTime');
  const timeString = currentTimeElement ? currentTimeElement.textContent : new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});

  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${message}</p>
      <span class="message-time">${timeString}</span>
    </div>
  `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateChatContext(userMessage) {
  const message = userMessage.toLowerCase();

  // Analyze user intent
  chatContext.userIntent = analyzeUserIntent(message);
  chatContext.lastQuestion = userMessage;
  chatContext.conversationStep++;

  // Check if user is asking about specific service
  if (message.includes('sepatu') || message.includes('tas') || message.includes('karpet') || message.includes('khusus')) {
    chatContext.awaitingServiceType = true;
  }

  // Save context to localStorage
  localStorage.setItem('chatContext', JSON.stringify(chatContext));
}

function analyzeUserIntent(message) {
  const lowerMessage = message.toLowerCase();

  if (chatBotData.greetings.some(word => lowerMessage.includes(word))) return 'greeting';
  if (chatBotData.pricing.some(word => lowerMessage.includes(word))) return 'pricing';
  if (chatBotData.services.some(word => lowerMessage.includes(word))) return 'services';
  if (chatBotData.timing.some(word => lowerMessage.includes(word))) return 'timing';
  if (chatBotData.location.some(word => lowerMessage.includes(word))) return 'location';
  if (chatBotData.tracking.some(word => lowerMessage.includes(word))) return 'tracking';
  if (chatBotData.contact.some(word => lowerMessage.includes(word))) return 'contact';
  if (chatBotData.reservation.some(word => lowerMessage.includes(word))) return 'reservation';

  return 'general';
}

function generateBotResponse(userMessage) {
  const message = userMessage.toLowerCase();
  const intent = chatContext.userIntent;

  // Check for greetings
  if (intent === 'greeting' || chatBotData.greetings.some(word => message.includes(word))) {
    return "Halo! Selamat datang di Family Laundry 😊 Ada yang bisa saya bantu hari ini?";
  }

  // Check for pricing questions
  if (intent === 'pricing' || chatBotData.pricing.some(word => message.includes(word))) {
    if (message.includes('sepatu')) {
      return "Laundry sepatu kami hanya Rp 25.000 per pasang! 🎯\nKami bersihkan secara manual dengan deterjen khusus untuk hasil maksimal.";
    } else if (message.includes('tas')) {
      return "Laundry tas: Rp 20.000 per buah 👜\nPerawatan khusus untuk berbagai jenis tas dengan hasil seperti baru!";
    } else if (message.includes('karpet')) {
      return "Laundry karpet: Rp 50.000 per m² 🏠\nCuci menyeluruh dengan mesin khusus karpet, bersih maksimal!";
    } else {
      return "Harga laundry kami sangat terjangkau! 💰\n• Laundry Kiloan: Rp 8.000/kg\n• Cuci & Setrika: Rp 10.000/kg\n• Cuci Kering: Rp 7.000/kg\n• Laundry Sepatu: Rp 25.000/pcs\n• Laundry Tas: Rp 20.000/pcs\nMau tahu detail layanan tertentu?";
    }
  }

  // Check for service questions
  if (intent === 'services' || chatBotData.services.some(word => message.includes(word))) {
    return "Kami menyediakan berbagai layanan laundry profesional: 🧺\n\n• Laundry Kiloan - Cuci biasa untuk pakaian sehari-hari\n• Cuci & Setrika - Cuci bersih + setrika rapi\n• Cuci Kering - Cuci saja tanpa setrika\n• Laundry Sepatu - Perawatan khusus sepatu\n• Laundry Tas - Cuci tas dengan bahan khusus\n• Laundry Karpet - Pembersihan karpet menyeluruh\n\nLayanan mana yang Anda butuhkan?";
  }

  // Check for timing questions
  if (intent === 'timing' || chatBotData.timing.some(word => message.includes(word))) {
    if (message.includes('cepat') || message.includes('express') || message.includes('kilat')) {
      return "Kami punya layanan express! 🚀\n• Express 6 jam: +50% dari harga normal\n• Express 12 jam: +30% dari harga normal\n• Reguler: 24-48 jam\nHubungi kami untuk info lebih lanjut!";
    } else {
      return "Waktu pengerjaan standar: ⏰\n• Laundry Pakaian: 24-48 jam\n• Laundry Sepatu & Tas: 2-3 hari\n• Laundry Karpet: 3-4 hari\n• Cuci Reguler: 1-2 hari\nKami selalu berusaha tepat waktu! Butuh lebih cepat?";
    }
  }

  // Check for location questions
  if (intent === 'location' || chatBotData.location.some(word => message.includes(word))) {
    return "Outlet kami berada di: 📍\nFamily Laundry Tulungagung\nJl. Trunojoyo, Tebokan, Boro, Kec. Kedungwaru\nKabupaten Tulungagung, Jawa Timur 66229\n\n🕐 Buka setiap hari: 07:00 - 22:00 WIB\n🚗 Fasilitas: Parkir luas, gratis antar jemput\n\nMau saya bantu dengan layanan antar jemput gratis?";
  }

  // Check for tracking questions
  if (intent === 'tracking' || chatBotData.tracking.some(word => message.includes(word))) {
    return "Untuk melacak pesanan, Anda bisa: 🔍\n1. Gunakan fitur 'Lacak Pesanan' di website\n2. Masukkan kode order (contoh: FL2024001)\n3. Atau hubungi kami via WhatsApp\n\nButuh bantuan lacak pesanan tertentu?";
  }

  // Check for contact questions
  if (intent === 'contact' || chatBotData.contact.some(word => message.includes(word))) {
    return "Silakan hubungi kami di: 📞\n• WhatsApp: 0857-4519-8337\n• Telepon: 0857-4519-8337\n• Alamat: Jl. Trunojoyo, Tebokan, Boro, Tulungagung\n\nMau langsung chat via WhatsApp untuk respon lebih cepat?";
  }

  // Check for reservation questions
  if (intent === 'reservation' || chatBotData.reservation.some(word => message.includes(word))) {
    return "Untuk pesan laundry, Anda bisa: 📋\n1. Isi form reservasi online di website kami\n2. Langsung chat via WhatsApp\n3. Datang ke outlet kami\n\nKami juga menyediakan layanan ANTAR JEMPUT GRATIS! Mau pesan sekarang?";
  }

  // Default response
  const defaultResponses = [
    "Maaf, saya belum paham pertanyaannya. Bisa diulangi dengan lebih detail? 😊",
    "Saya bisa bantu informasi tentang harga, layanan, lokasi, tracking pesanan, atau reservasi. Yang mana yang Anda butuhkan?",
    "Untuk pertanyaan lebih detail, boleh langsung hubungi customer service kami via WhatsApp? Mereka siap membantu 24 jam!",
    "Ada yang bisa saya bantu mengenai layanan laundry Family Laundry? Kami siap melayani dengan profesional!"
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

function shouldShowWhatsAppOption(message) {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('cs') ||
    lowerMessage.includes('customer service') ||
    lowerMessage.includes('whatsapp') ||
    lowerMessage.includes('wa') ||
    lowerMessage.includes('telepon') ||
    lowerMessage.includes('hubung') ||
    lowerMessage.includes('langsung') ||
    lowerMessage.includes('pesan') ||
    lowerMessage.includes('order') ||
    lowerMessage.length > 30
  );
}

function showWhatsAppOption() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  const optionDiv = document.createElement('div');
  optionDiv.className = 'whatsapp-redirect';

  optionDiv.innerHTML = `
    <p style="margin-bottom: 10px; font-size: 14px; color: var(--text-light);">Butuh bantuan lebih lanjut?</p>
    <a href="https://wa.me/6285745198337" target="_blank" class="btn-whatsapp-chat">
      <i class="fab fa-whatsapp"></i>
      Chat via WhatsApp
    </a>
  `;

  chatMessages.appendChild(optionDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addQuickOptionsToLatestMessage() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  const botMessages = chatMessages.querySelectorAll('.message.bot');
  const latestBotMessage = botMessages[botMessages.length - 1];

  if (latestBotMessage) {
    // Remove existing quick options
    const existingOptions = latestBotMessage.querySelector('.quick-options');
    if (existingOptions) {
      existingOptions.remove();
    }

    // Add new quick options
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'quick-options';

    optionsDiv.innerHTML = `
      <div class="quick-option" data-message="harga laundry">💰 Harga</div>
      <div class="quick-option" data-message="layanan apa saja">🧺 Layanan</div>
      <div class="quick-option" data-message="lama pengerjaan">⏰ Waktu</div>
      <div class="quick-option" data-message="lokasi outlet">📍 Lokasi</div>
    `;

    latestBotMessage.querySelector('.message-content').appendChild(optionsDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Quick option click handler
function quickOptionClick(question) {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = question;
    sendChatMessage();
  }
}

// Local Storage Functions
function saveChatToLocalStorage() {
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    localStorage.setItem('chatHistory', chatMessages.innerHTML);
  }
}

function loadChatFromLocalStorage() {
  const savedChat = localStorage.getItem('chatHistory');
  if (savedChat) {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      chatMessages.innerHTML = savedChat;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
}

// WhatsApp function
function openWhatsApp() {
  const message = "Halo Family Laundry! Saya butuh bantuan untuk layanan laundry.";
  window.open(`https://wa.me/6285745198337?text=${encodeURIComponent(message)}`, '_blank');
}

// Map functionality is now handled by Google Maps Embed
function initializeMap() {
  // No initialization needed for embedded map
  console.log('Using Google Maps Embed');
}

// Export functions for global access
window.trackOrder = trackOrder;
window.calculatePrice = calculatePrice;
window.scrollToReservation = scrollToReservation;
window.showLoyaltyModal = showLoyaltyModal;
window.submitReview = submitReview;
window.openWhatsApp = openWhatsApp;
window.quickOptionClick = quickOptionClick;
window.contactAboutOrder = contactAboutOrder;