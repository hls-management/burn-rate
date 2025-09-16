(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const l of t.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function o(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function s(e){if(e.ep)return;e.ep=!0;const t=o(e);fetch(e.href,t)}})();console.log("Burn Rate Web Version - Loading...");document.addEventListener("DOMContentLoaded",()=>{console.log("DOM loaded, initializing web interface...");const n=document.getElementById("loading-overlay");n&&(n.style.display="none"),r(),c(),console.log("Basic web interface initialized")});function r(){const n=document.querySelectorAll(".tab-button"),i=document.querySelectorAll(".command-panel");n.forEach(o=>{o.addEventListener("click",()=>{const s=o.getAttribute("data-tab");n.forEach(t=>t.classList.remove("active")),i.forEach(t=>t.classList.remove("active")),o.classList.add("active");const e=document.getElementById(`${s}-panel`);e&&e.classList.add("active")})})}function c(){const n=document.getElementById("modal-overlay"),i=document.getElementById("modal-close"),o=document.getElementById("help-btn"),s=document.getElementById("settings-btn");i&&n&&(i.addEventListener("click",()=>{n.classList.add("hidden")}),n.addEventListener("click",e=>{e.target===n&&n.classList.add("hidden")})),o&&o.addEventListener("click",()=>{a("Help",d())}),s&&s.addEventListener("click",()=>{a("Settings",u())})}function a(n,i){const o=document.getElementById("modal-overlay"),s=document.getElementById("modal-title"),e=document.getElementById("modal-body");o&&s&&e&&(s.textContent=n,e.innerHTML=i,o.classList.remove("hidden"))}function d(){return`
        <h4>Game Commands</h4>
        <p><strong>Build:</strong> Construct units and structures to strengthen your forces.</p>
        <p><strong>Attack:</strong> Launch attacks against enemy positions.</p>
        <p><strong>Scan:</strong> Gather intelligence about enemy activities.</p>
        <p><strong>End Turn:</strong> Complete your turn and let the AI take its actions.</p>
        
        <h4>Resources</h4>
        <p>Manage your resources carefully to maintain your military operations.</p>
        
        <h4>Victory Conditions</h4>
        <p>Defeat all enemy forces or achieve strategic objectives to win.</p>
    `}function u(){return`
        <h4>Game Settings</h4>
        <p>Settings panel will be implemented in future tasks.</p>
        <p>Available options will include:</p>
        <ul>
            <li>AI Difficulty</li>
            <li>Game Speed</li>
            <li>Visual Theme</li>
            <li>Sound Effects</li>
        </ul>
    `}
