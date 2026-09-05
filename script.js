let openWindows = [];
let maximizedWindowId = null;
let currentWindowId = null;
let currentActiveWindowId = null;
let currentImageIndex = 0;
let currentImageSet = [];
let currentBox = null;
let isZoomed = false;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;

document.addEventListener("DOMContentLoaded", function () {
  // Load menu
  fetch("/assets/menu.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("menu-container").innerHTML = data;
    })
    .catch((error) => console.error("Error loading menu:", error));

  // Load initial content
  loadContent("home", "./resume.html");
  loadContent("profile", "./profile.html");
  loadContent("education", "./edu.html");
  loadContent("portfolio", "./work.html");
  loadContent("experience", "./intern.html");

  // Open first window
  openWindow("home");

  // Set age
  calculateAge();

  // Initialize image modals
  setupImageModals();
  
  // เพิ่ม event listener สำหรับปุ่ม ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeImageModal();
    }
  });
});

// Content loading function
function loadContent(windowId, file) {
  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      return response.text();
    })
    .then(data => {
      const contentDiv = document.querySelector(`#${windowId} .window-content`);
      if (contentDiv) {
        contentDiv.innerHTML = data;
        // Reinitialize modals only if this window is active
        if (currentWindowId === windowId) {
          setupImageModals();
        }
      }
    })
    .catch(error => {
      console.error("Error:", error);
      const contentDiv = document.querySelector(`#${windowId} .window-content`);
      if (contentDiv) {
        contentDiv.innerHTML = "<p style='color:red;'>ไม่สามารถโหลดเนื้อหาได้</p>";
      }
    });
}

// Window management system
function toggleWindow(windowId) {
  const window = document.getElementById(windowId);
  if (!window) return;

  if (window.classList.contains("hidden")) {
    openWindow(windowId);
  } else if (currentWindowId === windowId) {
    minimizeWindow(windowId);
  } else {
    bringToFront(windowId);
  }
}

function openWindow(windowId) {
  const window = document.getElementById(windowId);
  if (!window) return;

  // Close current window if exists
  if (currentWindowId) {
    const currentWindow = document.getElementById(currentWindowId);
    if (currentWindow) {
      currentWindow.classList.add("hidden");
      document.getElementById(`${currentWindowId}Icon`)?.classList.remove("selected");
    }
  }

  // Open new window
  window.classList.remove("hidden", "minimized");
  
  // Reset size if maximized
  if (maximizedWindowId) {
    const maximizedWindow = document.getElementById(maximizedWindowId);
    if (maximizedWindow) {
      maximizedWindow.classList.remove("maximized-width");
      maximizedWindow.style.width = "90%";
      maximizedWindow.style.height = "75%";
    }
    maximizedWindowId = null;
  }

  // Position window
  Object.assign(window.style, {
    left: "50%",
    top: "45%",
    width: "90%",
    height: "75%",
    transform: "translate(-50%, -50%)",
    zIndex: getHighestZIndex() + 1
  });

  // Update state
  currentWindowId = windowId;
  currentActiveWindowId = windowId;
  document.getElementById(`${windowId}Icon`)?.classList.add("selected");
  
  // Setup modals for this window's content
  setupImageModals();
}

function closeWindow(windowId) {
  const window = document.getElementById(windowId);
  if (!window) return;

  window.classList.add("hidden");
  
  if (maximizedWindowId === windowId) {
    maximizedWindowId = null;
  }
  
  if (currentWindowId === windowId) {
    currentWindowId = null;
    currentActiveWindowId = null;
  }
  
  document.getElementById(`${windowId}Icon`)?.classList.remove("selected");
}

function minimizeWindow(windowId) {
  const window = document.getElementById(windowId);
  if (!window) return;

  window.classList.add("minimized");
  document.getElementById(`${windowId}Icon`)?.classList.remove("selected");
  
  if (currentWindowId === windowId) {
    currentWindowId = null;
    currentActiveWindowId = null;
  }
}

function maximizeWindow(windowId) {
  const window = document.getElementById(windowId);
  if (!window) return;
  
  if (window.classList.contains("maximized-width")) {
    // Unmaximize
    window.classList.remove("maximized-width");
    window.style.width = "90%";
    window.style.height = "75%";
    window.style.top = "45%";
    maximizedWindowId = null;
  } else {
    // Maximize
    window.classList.add("maximized-width");
    window.style.width = "95%";
    window.style.height = "85%";
    window.style.top = "60px";
    maximizedWindowId = windowId;
  }
  
  // Bring to front
  window.style.zIndex = getHighestZIndex() + 1;
}

function bringToFront(windowId) {
  const window = document.getElementById(windowId);
  if (!window) return;

  window.style.zIndex = getHighestZIndex() + 1;
  
  if (window.classList.contains("minimized")) {
    window.classList.remove("minimized");
    document.getElementById(`${windowId}Icon`)?.classList.add("selected");
  }
  
  currentWindowId = windowId;
  currentActiveWindowId = windowId;
  setupImageModals();
}

function getHighestZIndex() {
  const windows = document.querySelectorAll('.window');
  let highest = 0;
  windows.forEach(w => {
    const zIndex = parseInt(window.getComputedStyle(w).zIndex) || 0;
    if (zIndex > highest) highest = zIndex;
  });
  return highest;
}

// Helper functions
function calculateAge() {
  const birthDate = new Date("2002-07-18");
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  const ageElement = document.getElementById("age");
  if (ageElement) ageElement.textContent = age;
}

function isMobileDevice() {
  return window.innerWidth <= 1080;
}

// Theme switching
function toggleTheme() {
  const body = document.body;
  const icon = document.querySelector(".theme-toggle i");
  
  if (body.getAttribute("data-theme") === "light") {
    body.setAttribute("data-theme", "dark");
    icon.classList.replace("fa-sun", "fa-moon");
  } else {
    body.setAttribute("data-theme", "light");
    icon.classList.replace("fa-moon", "fa-sun");
  }
}

// Image Modal System with Zoom and Drag
function openImageModal(images, startIndex = 0, box) {
  if (currentActiveWindowId !== currentWindowId) return;

  currentImageSet = images;
  currentImageIndex = startIndex;
  currentBox = box;

  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img');
  const modalContent = modal.querySelector('.modal-content');
  const prevBtn = document.getElementById('prev-image');
  const nextBtn = document.getElementById('next-image');
  const closeBtn = document.getElementById('close-modal');
  const zoomBtn = document.getElementById('zoom-btn');
  const imageCounter = document.getElementById('image-counter');

  if (!modal || !modalImg || !modalContent) return;

  // แสดงรูป
  modalImg.src = images[startIndex];
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // รีเซ็ตสถานะซูม
  isZoomed = false;
  dragOffsetX = 0;
  dragOffsetY = 0;
  modalImg.classList.remove('zoomed');
  modalImg.style.transform = 'translate(0, 0) scale(1)';
  modalImg.style.cursor = 'zoom-in';
  
  // อัพเดทปุ่มซูม
  if (zoomBtn) {
    zoomBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
    zoomBtn.title = "ซูมภาพ";
  }
  
  // อัพเดทตัวนับภาพ
  if (imageCounter) {
    imageCounter.textContent = `${startIndex + 1} / ${images.length}`;
  }

  // ขนาด modal
  modalContent.style.width = '80vw';
  modalContent.style.height = '80vh';
  modalContent.style.maxWidth = 'none';
  modalContent.style.maxHeight = 'none';

  modalImg.style.maxWidth = '100%';
  modalImg.style.maxHeight = '100%';
  modalImg.style.objectFit = 'contain';
  modalImg.style.transition = 'transform 0.3s ease';

  // ปุ่มเลื่อนรูป: ซ่อนถ้ามีรูปเดียว
  if (images.length > 1) {
    if (prevBtn) prevBtn.style.display = 'block';
    if (nextBtn) nextBtn.style.display = 'block';
  } else {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
  }

  // คลิกพื้นที่ว่างรอบรูปปิด modal
  modal.onclick = function(e) {
    if (
      e.target !== modalContent &&
      e.target !== modalImg &&
      !e.target.classList.contains('nav-btn') &&
      e.target !== closeBtn &&
      e.target !== zoomBtn &&
      e.target !== imageCounter
    ) {
      closeImageModal();
    }
  };
  
  // เพิ่ม event listener สำหรับการซูม
  setupZoomAndDrag(modalImg, zoomBtn);
}

function setupZoomAndDrag(modalImg, zoomBtn) {
  if (!modalImg) return;
  
  // ลบ event listeners เก่า
  modalImg.removeEventListener('click', toggleZoom);
  modalImg.removeEventListener('mousedown', startDrag);
  modalImg.removeEventListener('touchstart', startDragTouch);
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('touchmove', doDragTouch);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchend', stopDrag);
  modalImg.removeEventListener('wheel', handleWheel);
  
  // ฟังก์ชันซูม
  function toggleZoom(e) {
    e.stopPropagation();
    
    if (!isZoomed) {
      // ซูมเข้า
      isZoomed = true;
      modalImg.classList.add('zoomed');
      modalImg.style.cursor = 'grab';
      modalImg.style.transform = `translate(0, 0) scale(1.5)`;
      
      if (zoomBtn) {
        zoomBtn.innerHTML = '<i class="fas fa-search-minus"></i>';
        zoomBtn.title = "ย่อภาพ";
      }
    } else {
      // ย่อออก
      isZoomed = false;
      modalImg.classList.remove('zoomed');
      modalImg.style.cursor = 'zoom-in';
      modalImg.style.transform = `translate(0, 0) scale(1)`;
      dragOffsetX = 0;
      dragOffsetY = 0;
      
      if (zoomBtn) {
        zoomBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
        zoomBtn.title = "ซูมภาพ";
      }
    }
  }
  
  // ฟังก์ชันซูมด้วยปุ่ม
  if (zoomBtn) {
    zoomBtn.onclick = toggleZoom;
  }
  
  // ฟังก์ชันซูมด้วยการคลิกที่รูป
  modalImg.addEventListener('click', toggleZoom);
  
  // ฟังก์ชันซูมด้วยเมาส์วิล
  function handleWheel(e) {
    if (!isZoomed) return;
    
    e.preventDefault();
    
    // คำนวณทิศทางการเลื่อน
    const deltaX = e.deltaX || 0;
    const deltaY = e.deltaY || 0;
    
    // จำกัดการเลื่อน
    const maxOffset = 200;
    dragOffsetX = Math.max(-maxOffset, Math.min(maxOffset, dragOffsetX + deltaX * 0.5));
    dragOffsetY = Math.max(-maxOffset, Math.min(maxOffset, dragOffsetY + deltaY * 0.5));
    
    modalImg.style.transform = `translate(${dragOffsetX}px, ${dragOffsetY}px) scale(1.5)`;
  }
  
  modalImg.addEventListener('wheel', handleWheel, { passive: false });
  
  // ฟังก์ชันลากเมาส์
  function startDrag(e) {
    if (!isZoomed) return;
    
    e.preventDefault();
    isDragging = true;
    dragStartX = e.clientX - dragOffsetX;
    dragStartY = e.clientY - dragOffsetY;
    modalImg.style.cursor = 'grabbing';
    modalImg.style.transition = 'none';
  }
  
  function startDragTouch(e) {
    if (!isZoomed) return;
    
    e.preventDefault();
    isDragging = true;
    const touch = e.touches[0];
    dragStartX = touch.clientX - dragOffsetX;
    dragStartY = touch.clientY - dragOffsetY;
    modalImg.style.cursor = 'grabbing';
    modalImg.style.transition = 'none';
  }
  
  function doDrag(e) {
    if (!isDragging || !isZoomed) return;
    
    e.preventDefault();
    dragOffsetX = e.clientX - dragStartX;
    dragOffsetY = e.clientY - dragStartY;
    
    // จำกัดการเลื่อน
    const maxOffset = 200;
    dragOffsetX = Math.max(-maxOffset, Math.min(maxOffset, dragOffsetX));
    dragOffsetY = Math.max(-maxOffset, Math.min(maxOffset, dragOffsetY));
    
    modalImg.style.transform = `translate(${dragOffsetX}px, ${dragOffsetY}px) scale(1.5)`;
  }
  
  function doDragTouch(e) {
    if (!isDragging || !isZoomed) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    dragOffsetX = touch.clientX - dragStartX;
    dragOffsetY = touch.clientY - dragStartY;
    
    // จำกัดการเลื่อน
    const maxOffset = 200;
    dragOffsetX = Math.max(-maxOffset, Math.min(maxOffset, dragOffsetX));
    dragOffsetY = Math.max(-maxOffset, Math.min(maxOffset, dragOffsetY));
    
    modalImg.style.transform = `translate(${dragOffsetX}px, ${dragOffsetY}px) scale(1.5)`;
  }
  
  function stopDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    modalImg.style.cursor = 'grab';
    modalImg.style.transition = 'transform 0.3s ease';
  }
  
  // เพิ่ม event listeners สำหรับลากเมาส์
  modalImg.addEventListener('mousedown', startDrag);
  modalImg.addEventListener('touchstart', startDragTouch, { passive: false });
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('touchmove', doDragTouch, { passive: false });
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);
}

function closeImageModal() {
  const modal = document.getElementById('image-modal');
  const modalContent = document.querySelector('.modal-content');
  const modalImg = document.getElementById('modal-img');

  if (modal && modalContent && modalImg) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    modalContent.style.width = '';
    modalContent.style.height = '';
    
    // รีเซ็ตการซูม
    isZoomed = false;
    dragOffsetX = 0;
    dragOffsetY = 0;
    modalImg.classList.remove('zoomed');
    modalImg.style.transform = 'translate(0, 0) scale(1)';
    modalImg.style.cursor = 'zoom-in';
  }
}

// แก้ไขฟังก์ชัน switchImage ให้เลือกเฉพาะ img.clickable-image
function switchImage(box, index) {
  if (!box) return;
  
  const images = JSON.parse(box.getAttribute('data-images') || '[]');
  if (index >= 0 && index < images.length) {
    // IMPORTANT: เลือกเฉพาะ img ที่มี class clickable-image เท่านั้น
    // ไม่ใช่ img แรกที่เจอ
    const mainImg = box.querySelector('img.clickable-image');
    if (mainImg) {
      mainImg.src = images[index];
    }
    
    // Update active button
    const btnContainer = box.querySelector('.btn-container');
    if (btnContainer) {
      const buttons = btnContainer.querySelectorAll('.image-btn');
      buttons.forEach((btn, i) => {
        if (i === index) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }
}

function setupImageModals() {
  // Clear all existing click handlers first
  document.querySelectorAll('.clickable-image').forEach(img => {
    img.removeEventListener('click', handleImageClick);
  });

  // Only set up modals for the active window
  if (!currentActiveWindowId) return;
  
  const activeWindow = document.getElementById(currentActiveWindowId);
  if (!activeWindow) return;

  // Set up new click handlers for images in the active window
  activeWindow.querySelectorAll('[data-images]').forEach(box => {
    // IMPORTANT: เลือกเฉพาะรูปที่เป็น clickable-image (รูปหลัก)
    // ไม่ใช่ img ทั้งหมดใน box
    const mainImg = box.querySelector('img.clickable-image');
    if (mainImg) {
      // เพิ่ม event listener ให้รูปหลัก
      mainImg.addEventListener('click', handleImageClick);
    }
  });

  // Set up modal navigation buttons
  const prevBtn = document.getElementById('prev-image');
  const nextBtn = document.getElementById('next-image');
  const closeModal = document.getElementById('close-modal');
  const zoomBtn = document.getElementById('zoom-btn');
  
  if (prevBtn) {
    prevBtn.onclick = function(e) {
      e.stopPropagation();
      navigateImage(-1);
    };
  }
  
  if (nextBtn) {
    nextBtn.onclick = function(e) {
      e.stopPropagation();
      navigateImage(1);
    };
  }
  
  if (closeModal) {
    closeModal.onclick = closeImageModal;
  }
  
  if (zoomBtn) {
    zoomBtn.onclick = function(e) {
      e.stopPropagation();
      const modalImg = document.getElementById('modal-img');
      if (modalImg) {
        // สร้าง event สำหรับคลิกที่รูปภาพ
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        modalImg.dispatchEvent(clickEvent);
      }
    };
  }
}

function handleImageClick() {
  const box = this.closest('[data-images]');
  if (!box || currentActiveWindowId !== currentWindowId) return;
  
  const images = JSON.parse(box.getAttribute('data-images') || '[]');
  if (images.length === 0) return;
  
  const currentSrc = this.src.split('/').pop();
  const startIndex = images.findIndex(img => img.includes(currentSrc));
  
  openImageModal(images, startIndex >= 0 ? startIndex : 0, box);
}

// แก้ไขฟังก์ชัน navigateImage ให้เลือกเฉพาะ img.clickable-image
function navigateImage(direction) {
  if (currentImageSet.length === 0 || currentActiveWindowId !== currentWindowId) return;
  
  currentImageIndex = (currentImageIndex + direction + currentImageSet.length) % currentImageSet.length;
  
  const modalImg = document.getElementById('modal-img');
  const imageCounter = document.getElementById('image-counter');
  
  if (modalImg) {
    modalImg.src = currentImageSet[currentImageIndex];
    
    // รีเซ็ตการซูมเมื่อเปลี่ยนรูป
    isZoomed = false;
    dragOffsetX = 0;
    dragOffsetY = 0;
    modalImg.classList.remove('zoomed');
    modalImg.style.transform = 'translate(0, 0) scale(1)';
    modalImg.style.cursor = 'zoom-in';
    
    // อัพเดทปุ่มซูม
    const zoomBtn = document.getElementById('zoom-btn');
    if (zoomBtn) {
      zoomBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
      zoomBtn.title = "ซูมภาพ";
    }
  }
  
  if (imageCounter) {
    imageCounter.textContent = `${currentImageIndex + 1} / ${currentImageSet.length}`;
  }
  
  // Update source image and buttons in the original window
  if (currentBox) {
    // IMPORTANT: เลือกเฉพาะ img.clickable-image
    const mainImg = currentBox.querySelector('img.clickable-image');
    if (mainImg) {
      mainImg.src = currentImageSet[currentImageIndex];
    }
    
    const btnContainer = currentBox.querySelector('.btn-container');
    if (btnContainer) {
      const buttons = btnContainer.querySelectorAll('.image-btn');
      buttons.forEach((btn, i) => {
        if (i === currentImageIndex) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }
}