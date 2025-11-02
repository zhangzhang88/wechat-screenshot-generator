document.addEventListener('DOMContentLoaded', () => {
    const chatArea = document.getElementById('chat-area');
    const messageTextInput = document.getElementById('message-text');
    const messageSenderSelect = document.getElementById('message-sender');
    const addMessageButton = document.getElementById('add-message');
    const clearMessagesButton = document.getElementById('clear-messages');
    const generateScreenshotButton = document.getElementById('generate-screenshot');
    const chatTitleDisplay = document.getElementById('chat-title');
    const timestampTemplate = document.getElementById('timestamp-template');
    let lastTimestamp = null; // 用于记录上一个时间戳，避免重复添加

    const addRoleButton = document.getElementById('add-role-button');
    const rolesList = document.getElementById('roles-list');

    let roles = [];
    let nextRoleId = 1;
    let selectedSenderId = null;

    const headerTimeDisplay = document.getElementById('header-time');
    const customHeaderTimeInput = document.getElementById('custom-header-time');
    // chatCountDisplay 不再需要，因为 <1 图标已移除

    // 新增函数来更新聊天标题
    function updateChatTitle() {
        if (roles.length === 0) {
            chatTitleDisplay.textContent = '微信聊天';
        } else if (roles.length === 1) {
            chatTitleDisplay.textContent = roles[0].name; // 只有一个角色时显示自己的名字
        } else {
            // 假设第一个角色是“自己”，标题显示第二个角色的名字
            chatTitleDisplay.textContent = roles[1].name;
        }
    }

    // 顶部时间显示（模拟微信顶部栏时间）
    function updateHeaderTime(customTime = null) {
        if (customTime) {
            headerTimeDisplay.textContent = customTime;
        } else {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            headerTimeDisplay.textContent = `${hours}:${minutes}`;
        }
    }
    updateHeaderTime();
    setInterval(() => updateHeaderTime(customHeaderTimeInput.value.trim()), 60000); // 每分钟更新一次，优先使用自定义时间

    customHeaderTimeInput.addEventListener('input', (e) => {
        updateHeaderTime(e.target.value.trim());
    });

    // updateChatCount 不再需要，因为 <1 图标已移除

    const roleItemTemplate = document.getElementById('role-item-template');

    // 角色管理功能
    function renderRoles() {
        rolesList.innerHTML = '';
        messageSenderSelect.innerHTML = '';

        if (roles.length === 0) {
            rolesList.innerHTML = '<p>暂无角色。点击“添加角色”创建。</p>';
            return;
        }

        roles.forEach(role => {
            const roleItem = roleItemTemplate.content.cloneNode(true).querySelector('.role-item');
            roleItem.dataset.roleId = role.id;

            const avatarImg = roleItem.querySelector('.role-avatar-preview');
            avatarImg.src = role.avatar || `https://dummyimage.com/30x30/000/fff&text=${role.name.substring(0, 1)}`;
            avatarImg.alt = role.name;

            const nameInput = roleItem.querySelector('.role-name-input');
            nameInput.value = role.name;
            nameInput.addEventListener('change', (e) => {
                role.name = e.target.value;
                renderRoles();
            });

            const uploadAvatarButton = roleItem.querySelector('.upload-avatar-button');
            const avatarUploadInput = roleItem.querySelector('.role-avatar-upload');

            uploadAvatarButton.addEventListener('click', () => {
                avatarUploadInput.click();
            });

            avatarUploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        role.avatar = event.target.result;
                        renderRoles();
                    };
                    reader.readAsDataURL(file);
                }
            });

            const deleteButton = roleItem.querySelector('.delete-role');
            deleteButton.addEventListener('click', () => {
                deleteRole(role.id);
            });

            const selectButton = roleItem.querySelector('.select-role');
            selectButton.textContent = selectedSenderId === role.id ? '已选' : '选择';
            if (selectedSenderId === role.id) {
                selectButton.classList.add('active');
                roleItem.classList.add('selected');
            }
            selectButton.addEventListener('click', () => {
                selectSender(role.id);
            });

            rolesList.appendChild(roleItem);

            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.name;
            messageSenderSelect.appendChild(option);
        });

        if (selectedSenderId) {
            messageSenderSelect.value = selectedSenderId;
        } else if (roles.length > 0) {
            selectedSenderId = roles[0].id;
            messageSenderSelect.value = selectedSenderId;
            renderRoles();
            updateChatAvatars(); // 更新聊天区域的头像
        }
        updateChatTitle(); // 在渲染角色后更新标题
    }

    function addRole(name = `角色 ${nextRoleId}`, avatar = '') {
        const newRole = {
            id: nextRoleId++,
            name: name,
            avatar: avatar
        };
        roles.push(newRole);
        renderRoles();
        // 默认选择新添加的角色作为发送者
        selectSender(newRole.id);
        updateChatTitle(); // 添加角色后更新标题
        // updateChatCount 不再需要
    }

    function deleteRole(id) {
        roles = roles.filter(role => role.id !== id);
        if (selectedSenderId === id) {
            selectedSenderId = roles.length > 0 ? roles[0].id : null;
        }
        renderRoles();
        updateChatTitle(); // 删除角色后更新标题
        // updateChatCount 不再需要
    }

    function selectSender(id) {
        selectedSenderId = id;
        renderRoles();
        // 聊天标题现在由 updateChatTitle 管理，不在这里直接修改
    }

    addRoleButton.addEventListener('click', () => {
        addRole();
    });

    // 消息发送功能
    addMessageButton.addEventListener('click', () => {
        const messageText = messageTextInput.value.trim();
        const senderId = parseInt(messageSenderSelect.value);
        const senderRole = roles.find(role => role.id === senderId);

        if (messageText && senderRole) {
            addMessageToChat(messageText, senderRole);
            messageTextInput.value = '';
            chatArea.scrollTop = chatArea.scrollHeight; // 滚动到底部
        }
    });

    clearMessagesButton.addEventListener('click', () => {
        chatArea.innerHTML = '';
    });

    function addMessageToChat(text, senderRole) {
        const now = new Date();
        const currentTimestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // 检查是否需要添加时间戳
        if (!lastTimestamp || (now.getTime() - lastTimestamp.getTime()) > (2 * 60 * 1000)) { // 2分钟间隔
            const timestampDiv = timestampTemplate.content.cloneNode(true).querySelector('.timestamp');
            timestampDiv.querySelector('span').textContent = currentTimestamp;
            chatArea.appendChild(timestampDiv);
            lastTimestamp = now;
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');

        const isSent = (roles.length > 0 && senderRole.id === roles[0].id); // 假设第一个角色是“自己”
        messageDiv.classList.add(isSent ? 'sent' : 'received');
        messageDiv.dataset.senderId = senderRole.id;

        const avatarImg = document.createElement('img');
        avatarImg.classList.add('message-avatar');
        avatarImg.src = senderRole.avatar || `https://dummyimage.com/30x30/000/fff&text=${senderRole.name.substring(0, 1)}`;
        avatarImg.alt = senderRole.name;

        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('message-bubble');
        bubbleDiv.textContent = text;

        if (isSent) {
            messageDiv.appendChild(bubbleDiv);
            messageDiv.appendChild(avatarImg);
        } else {
            messageDiv.appendChild(avatarImg);
            messageDiv.appendChild(bubbleDiv);
        }
        chatArea.appendChild(messageDiv);
    }

    function updateChatAvatars() {
        const messages = chatArea.querySelectorAll('.message');
        messages.forEach(messageDiv => {
            const senderId = parseInt(messageDiv.dataset.senderId);
            const senderRole = roles.find(role => role.id === senderId);
            if (senderRole) {
                const avatarImg = messageDiv.querySelector('.message-avatar');
                if (avatarImg) {
                    avatarImg.src = senderRole.avatar || `https://dummyimage.com/30x30/000/fff&text=${senderRole.name.substring(0, 1)}`;
                    avatarImg.alt = senderRole.name;
                }
            }
        });
    }

    generateScreenshotButton.addEventListener('click', () => {
        if (typeof html2canvas !== 'undefined') {
            html2canvas(document.querySelector('.wechat-mockup')).then(canvas => {
                const link = document.createElement('a');
                link.download = 'wechat-screenshot.png';
                link.href = canvas.toDataURL();
                link.click();
            });
        } else {
            alert('请在 index.html 中引入 html2canvas 库以生成截图。\n例如：<script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>');
        }
    });

    // 初始加载默认角色
    addRole('自己', `https://dummyimage.com/30x30/FF5733/FFFFFF&text=我`); // 默认“自己”
    addRole('朋友', `https://dummyimage.com/30x30/3366FF/FFFFFF&text=友`); // 默认“朋友”
    selectSender(roles[0].id); // 默认选择第一个角色为发送者
    // updateChatCount 不再需要

    // 初始添加一些示例消息
    // 确保角色已加载
    setTimeout(() => {
        if (roles.length >= 2) {
            addMessageToChat('你好，这个怎么使用？', roles[1]); // 朋友发送
            addMessageToChat('你可以通过右侧的控制面板添加角色和消息。', roles[0]); // 自己发送
            addMessageToChat('明白了，谢谢！', roles[1]); // 朋友发送
        }
    }, 100); // 稍作延迟，确保角色渲染完成
});
