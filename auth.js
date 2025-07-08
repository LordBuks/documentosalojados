// auth.js - Módulo de gerenciamento de autenticação
import { auth } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Estado de autenticação
let currentUser = null;
let authInitialized = false;

// Callbacks para mudanças de estado
const authCallbacks = [];

// Inicializar monitoramento de autenticação
export function initAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      authInitialized = true;
      
      // Notificar todos os callbacks registrados
      authCallbacks.forEach(callback => callback(user));
      
      resolve(user);
    });
  });
}

// Verificar se o usuário está autenticado
export function isAuthenticated() {
  return currentUser !== null;
}

// Verificar se é o usuário autorizado
export function isAuthorizedUser() {
  return currentUser && currentUser.email === "servicosocial@inter.com";
}

// Obter usuário atual
export function getCurrentUser() {
  return currentUser;
}

// Registrar callback para mudanças de autenticação
export function onAuthChange(callback) {
  authCallbacks.push(callback);
  
  // Se já inicializado, chamar imediatamente
  if (authInitialized) {
    callback(currentUser);
  }
}

// Fazer logout
export async function logout() {
  try {
    await signOut(auth);
    currentUser = null;
    window.location.href = "login.html";
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw error;
  }
}

// Redirecionar para login se não autenticado
export function requireAuth() {
  if (!authInitialized) {
    // Se ainda não inicializou, aguardar
    initAuth().then(() => {
      if (!isAuthorizedUser()) {
        window.location.href = "login.html";
      }
    });
  } else if (!isAuthorizedUser()) {
    window.location.href = "login.html";
  }
}

// Criar botão de logout
export function createLogoutButton(container) {
  const logoutBtn = document.createElement('button');
  logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair';
  logoutBtn.className = 'logout-btn';
  logoutBtn.style.cssText = `
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  logoutBtn.addEventListener('mouseenter', () => {
    logoutBtn.style.transform = 'translateY(-2px)';
    logoutBtn.style.boxShadow = '0 5px 15px rgba(255, 107, 107, 0.3)';
  });
  
  logoutBtn.addEventListener('mouseleave', () => {
    logoutBtn.style.transform = 'translateY(0)';
    logoutBtn.style.boxShadow = 'none';
  });
  
  logoutBtn.addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      try {
        await logout();
      } catch (error) {
        alert('Erro ao fazer logout. Tente novamente.');
      }
    }
  });
  
  if (container) {
    container.appendChild(logoutBtn);
  }
  
  return logoutBtn;
}

// Mostrar informações do usuário
export function showUserInfo(container) {
  if (!isAuthenticated()) return;
  
  const userInfo = document.createElement('div');
  userInfo.className = 'user-info';
  userInfo.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #333;
    font-size: 0.9rem;
  `;
  
  userInfo.innerHTML = `
    <i class="fas fa-user-circle" style="font-size: 1.2rem; color: #667eea;"></i>
    <span>${currentUser.email}</span>
  `;
  
  if (container) {
    container.appendChild(userInfo);
  }
  
  return userInfo;
}

