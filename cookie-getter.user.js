// ==UserScript==
// @name         超级Cookie获取器
// @namespace    https://github.com/codwiah/cookie-getter
// @version      1.0
// @description  获取网页所有的Cookie，包括HttpOnly和动态Cookie
// @author       codwiah
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    // 存储所有捕获到的cookie
    const cookieStore = {
        cookies: new Set(),
        add: function(cookie) {
            if (cookie && typeof cookie === 'string') {
                this.cookies.add(cookie.trim());
            }
        },
        getAll: function() {
            return Array.from(this.cookies);
        },
        clear: function() {
            this.cookies.clear();
        }
    };

    // 获取当前所有可见的cookie
    function getVisibleCookies() {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => cookieStore.add(cookie));
    }

    // 拦截XMLHttpRequest以获取cookie
    function interceptXHR() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
        
        XMLHttpRequest.prototype.open = function() {
            this._url = arguments[1];
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
            if (header.toLowerCase() === 'cookie') {
                cookieStore.add(value);
            }
            return originalSetRequestHeader.apply(this, arguments);
        };
    }

    // 拦截Fetch请求以获取cookie
    function interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = function() {
            const request = arguments[0];
            if (request && request.headers) {
                const cookie = request.headers.get('cookie');
                if (cookie) {
                    cookieStore.add(cookie);
                }
            }
            return originalFetch.apply(this, arguments);
        };
    }

    // 创建用户界面
    function createUI() {
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '999999',
            backgroundColor: '#fff',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            display: 'none',
            maxWidth: '80vw',
            maxHeight: '80vh',
            overflow: 'auto'
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
        });

        const title = document.createElement('h3');
        title.textContent = 'Cookie获取器';
        title.style.margin = '0';

        const buttonGroup = document.createElement('div');
        buttonGroup.style.display = 'flex';
        buttonGroup.style.gap = '10px';

        const copyButton = createButton('复制', '#4CAF50');
        const refreshButton = createButton('刷新', '#2196F3');
        const closeButton = createButton('关闭', '#f44336');

        const content = document.createElement('pre');
        Object.assign(content.style, {
            margin: '10px 0',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '14px'
        });

        // 组装UI
        buttonGroup.appendChild(copyButton);
        buttonGroup.appendChild(refreshButton);
        buttonGroup.appendChild(closeButton);
        header.appendChild(title);
        header.appendChild(buttonGroup);
        container.appendChild(header);
        container.appendChild(content);
        document.body.appendChild(container);

        // 创建悬浮按钮
        const floatButton = createButton('获取Cookie', '#4CAF50');
        Object.assign(floatButton.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '999998'
        });
        document.body.appendChild(floatButton);

        // 更新内容函数
        function updateContent() {
            getVisibleCookies();
            const allCookies = cookieStore.getAll();
            content.textContent = allCookies.length > 0 
                ? allCookies.join('\n')
                : '未发现任何Cookie';
        }

        // 事件处理
        copyButton.onclick = () => {
            GM_setClipboard(content.textContent);
            alert('Cookie已复制到剪贴板！');
        };

        refreshButton.onclick = updateContent;

        closeButton.onclick = () => {
            container.style.display = 'none';
            floatButton.style.display = 'block';
        };

        floatButton.onclick = () => {
            container.style.display = 'block';
            floatButton.style.display = 'none';
            updateContent();
        };

        // 注册快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key === 'c') {
                floatButton.click();
            }
        });

        return {
            update: updateContent,
            show: () => floatButton.click()
        };
    }

    // 创建按钮的辅助函数
    function createButton(text, color) {
        const button = document.createElement('button');
        Object.assign(button.style, {
            padding: '5px 10px',
            backgroundColor: color,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
        });
        button.textContent = text;
        return button;
    }

    // 初始化函数
    function init() {
        interceptXHR();
        interceptFetch();
        const ui = createUI();

        // 注册油猴菜单
        GM_registerMenuCommand('显示Cookie获取器', () => ui.show());

        // 定期检查新的cookie
        setInterval(() => {
            if (document.querySelector('div[style*="display: block"]')) {
                ui.update();
            }
        }, 1000);
    }

    // 当DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();