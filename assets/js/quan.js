window.Lately && Lately.init();
window.ViewImage && ViewImage.init('.images-wrapper img');
let observer = lozad('.lozad');
observer.observe();
// memo 内容超过 5 行折叠显示
function toggleMemoContent() {
    const contentElements = document.querySelectorAll('.post-summary');

    contentElements.forEach(contentElement => {
        const nextSibling = contentElement.nextElementSibling;
        if (nextSibling && nextSibling.classList.contains('read-more-button')) {
            // 如果下一个兄弟元素是readMoreButton，跳过
            return;
        }

        const readMoreButton = document.createElement('div');
        readMoreButton.className = 'read-more-button';
        const span = document.createElement('span');
        span.textContent = '全文';
        span.setAttribute('data-state', 'collapsed');
        readMoreButton.appendChild(span);

        // 检查是否需要显示“显示全文”按钮
        if (contentElement.offsetHeight < contentElement.scrollHeight) {
            contentElement.parentNode.insertBefore(readMoreButton, contentElement.nextSibling);
        }

        // 添加事件监听器
        span.addEventListener('click', function() {
            const currentState = this.getAttribute('data-state');
            if (currentState === 'collapsed') {
                contentElement.classList.add('full-content');
                this.textContent = '收起';
                this.setAttribute('data-state', 'expanded');
            } else {
                contentElement.classList.remove('full-content');
                this.textContent = '全文';
                this.setAttribute('data-state', 'collapsed');
            }
        });
    });
};
toggleMemoContent();

// 暗色模式切换
let switchButton;
let autoDefinedScheme = window.matchMedia('(prefers-color-scheme: dark)');

function switchTheme(e) {
    if (!hasUserSetTheme) {
        hasUserSetTheme = true;
        currentTheme = autoDefinedScheme.matches ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY, currentTheme);
    } else {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY, currentTheme);
    }
    document.documentElement.setAttribute('data-theme', currentTheme);
}

// 监听系统颜色模式变化
autoDefinedScheme.addEventListener('change', (e) => {
    if (!hasUserSetTheme) {
        currentTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    switchButton = document.querySelector('.theme-switcher');
    
    if (switchButton) {
        switchButton.addEventListener('click', switchTheme);
    }
});

// 评论点赞面板切换
function manageToolContent(event, isGlobalClick = false) {
    const clickedElement = event.currentTarget || document.querySelector('.post-tool:contains("'+event.target.textContent+'")');
    const clickedToolContent = clickedElement ? clickedElement.nextElementSibling : null;

    // 只有在全局点击事件中，并且点击的目标不是.post-tool或其后代元素时，才执行隐藏操作
    if (isGlobalClick && !event.target.closest('.post-tool')) {
        // 遍历所有.post-tool-content，移除'on'类
        document.querySelectorAll('.post-tool-content').forEach(content => {
            content.classList.remove('on');
        });
    } else if (clickedToolContent) {
        // 对于.post-tool的点击，切换当前.post-tool-content的'on'类
        clickedToolContent.classList.toggle('on');
    }
}

// 绑定事件的函数
function toggleToolConntent() {
    // 绑定.post-tool上的点击事件
    document.querySelectorAll('.post-tool').forEach(tool => {
        tool.addEventListener('click', manageToolContent);
    });

    // 绑定全局点击事件
    document.addEventListener('click', (event) => manageToolContent(event, true));
}
toggleToolConntent();

// 单图长宽控制
function handleImageLoad(img) {
    img.addEventListener('load', function() {
        const imgWidth = this.naturalWidth;
        const imgHeight = this.naturalHeight;
        const imgRation = imgWidth / imgHeight;

        if(imgRation > 1) {
            // 设置CSS自定义属性到单图容器
            this.style.setProperty('--max-width', '82.5%');
            this.style.setProperty('--max-height', 'auto');
        } else {
            this.style.setProperty('--max-width', '82.5%');
            this.style.setProperty('--max-height', '360px');
        }
    });
}
function bindImageLoadingEvents() {
    const singleImages = document.querySelectorAll('.single-image');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target.querySelector('img');
                if (img && img.dataset.src) {
                    img.src = img.dataset.src;
                    observer.unobserve(entry.target); // 停止观察此容器
                    handleImageLoad(img);
                } else {
                    console.warn('Image or data-src attribute not found in the .single-image container.');
                }
            }
        });
    });

    singleImages.forEach(singleImage => {
        observer.observe(singleImage);
    });
}
bindImageLoadingEvents();

function showContent() {
    document.body.style.visibility = 'visible';
    document.body.style.opacity = 1;
}
document.addEventListener('DOMContentLoaded', function() {
    showContent();
});
document.addEventListener('DOMContentLoaded', function() {
    // 点击加载下一页
    var paginationDiv = document.querySelector('.pagination');
    // 选择带有.load-next-post类的元素
    var loadNextPostLink = document.querySelector('.load-next-post');
        
    if (loadNextPostLink) { // 确保元素存在
        loadNextPostLink.addEventListener('click', function(event) {

            event.preventDefault(); // 阻止默认的链接跳转行为
                
            var nextPageUrl = this.getAttribute('data-url'); // 获取目标URL

            // 使用fetch API获取新内容
            fetch(nextPageUrl)
                .then(response => response.text())
                .then(data => {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(data, 'text/html');
                        
                    // 获取目标页面中所有.post-list div的内容
                    var newPostLists = doc.querySelectorAll('.post-list');
                    var newContent = ''; // 用于累积所有.post-list的HTML内容
                    // 遍历每个.post-list元素并累积其innerHTML
                    for (var i = 0; i < newPostLists.length; i++) {
                        newContent += newPostLists[i].outerHTML;
                    }

                    // 将新内容插入到当前页面的指定位置，这里以'id=post-container'为例
                    paginationDiv.insertAdjacentHTML('beforebegin', newContent);


                    // 尝试使用setTimeout来确保DOM更新完成
                    setTimeout(() => {
                        var newPostListNum = document.querySelectorAll('.post-list').length;
                        var firstNewPostList = document.querySelectorAll('.post-list')[newPostListNum - newPostLists.length]; 
                        firstNewPostList.scrollIntoView({ behavior: 'smooth' });
                    }, 100); // 100毫秒的延迟，根据实际情况可能需要调整

                    var newLoadNextPostLink = doc.querySelector('.load-next-post');
                    if (newLoadNextPostLink) {
                        this.setAttribute('data-url', newLoadNextPostLink.getAttribute('data-url'));
                    } else {
                        // 如果没有更多下一页，移除当前的.load-next-post链接
                        paginationDiv.innerHTML = '<span class="small">没了没了，榨干了</span>';
                    }

                    toggleMemoContent();
                    toggleToolConntent();
                    bindImageLoadingEvents();
                    toggleCommentArea();
                    let observer = lozad('.lozad');
                    observer.observe();
                })
                .catch(error => console.error('Error fetching next page:', error));
        });
    }
});

let emojis = [{"icon": "😂","text": "哭笑不得"},{"icon": "😎","text": "酷"},{"icon": "😏","text": "坏笑"},{"icon": "😅","text": "流汗"},{"icon": "😄","text": "笑"},{"icon": "😜","text": "调皮"},{"icon": "🤣","text": "笑倒"},{"icon": "😭","text": "大哭"},{"icon": "🙄","text": "白眼"},{"icon": "🤐","text": "嘘"},{"icon": "😋","text": "美食脸"},{"icon": "🥶","text": "冰冻"},{"icon": "🥵","text": "热"},{"icon": "😴","text": "睡觉"},{"icon": "🤧","text": "打喷嚏"},{"icon": "🍉","text": "西瓜"},{"icon": "😱","text": "惊恐"},{"icon": "👋","text": "招手"},{"icon": "🔨","text": "锤子"},{"icon": "🐶","text": "小狗"},{"icon": "👏","text": "鼓掌"},{"icon": "🙈","text": "不看"},{"icon": "😓","text": "汗"},{"icon": "😍","text": "爱心眼"},{"icon": "🤝","text": "握手"},{"icon": "🥺","text": "求你"},{"icon": "😔","text": "沮丧"},{"icon": "😪","text": "困"},{"icon": "😕","text": "困惑"},{"icon": "🤷‍♂️","text": "摊手"},{"icon": "😛","text": "舌头"},{"icon": "🤭","text": "偷笑"},{"icon": "🤮","text": "呕吐"},{"icon": "🥺","text": "求你"},{"icon": "🙂","text": "轻松的笑"},{"icon": "😈","text": "恶魔"},{"icon": "😃","text": "笑脸"},{"icon": "🤫","text": "嘘"},{"icon": "😒","text": "无语"},{"icon": "😵","text": "晕"},{"icon": "💪","text": "加油"},{"icon": "👍","text": "赞"},{"icon": "👎",  "text": "踩"},{"icon": "😡","text": "愤怒"},{"icon": "🤬","text": "怒骂"},{"icon": "😖","text": "心烦"},{"icon": "🌹","text": "玫瑰"},{"icon": "🏃","text": "跑步"},{"icon": "😆","text": "大笑"},{"icon": "💵","text": "钞票"},{"icon": "😘","text": "飞吻"},{"icon": "😷","text": "生病"},{"icon": "🤕","text": "受伤"},{"icon": "🎉","text": "庆祝"},{"icon": "❤️","text": "红心"},{"icon": "💔","text": "心碎"},{"icon": "😣","text": "无奈"},{"icon": "😘","text": "飞吻"},{"icon": "💩","text": "一坨便便"},{"icon": "🤩","text": "爱慕"}];

// 表情列表容器
const emojiList = document.createElement('div');
emojiList.className = 'emoji-list';

// 创建表情列表
emojis.forEach(emoji => {
    const emojiItem = document.createElement('span');
    emojiItem.className = 'emoji-item';
    emojiItem.textContent = emoji.icon;
    emojiItem.addEventListener('click', () => insertEmoji(emoji.icon));
    emojiList.appendChild(emojiItem);
});
// 显示和隐藏表情列表
function showEmojis() {
    const commentPanel = document.querySelector('.comment-panel');
    if (commentPanel.querySelector('.emoji-list')) {
        commentPanel.removeChild(commentPanel.querySelector('.emoji-list'));
    } else {
        commentPanel.appendChild(emojiList);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const smilly = document.querySelector('.smilly-icon');
    smilly.addEventListener('click', showEmojis);
});

// 插入表情到input中
function insertEmoji(emoji) {
    const input = document.querySelector('.comment-content');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    input.value = value.substring(0, start) + emoji + value.substring(end);
    input.setSelectionRange(start + emoji.length, start + emoji.length);
    // 触发input事件
    input.dispatchEvent(new Event('input'));
}

let currentPostId = null; // 用于存储当前选中的帖子ID
function toggleCommentArea() {
    // 绑定.post-toggle-comment的点击事件
    document.querySelectorAll('.post-toggle-comment').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.getAttribute('data-post');
            currentPostId = postId; // 保存当前选中的帖子ID
            const footerMenu = document.querySelector('.footer-menu');
            const commentPanel = document.querySelector('.comment-panel');

            commentPanel.classList.remove('d-none');
            commentPanel.classList.add('d-block');
            footerMenu.classList.remove('d-flex');
            footerMenu.classList.add('d-none');

            document.addEventListener('click', handleDocumentClick);

        });
    });
};
toggleCommentArea();

document.addEventListener('DOMContentLoaded', function() {
    const commentContent = document.querySelector('.comment-content');
    const commentSubmit = document.querySelector('.submit-comment');

    // 更新updateSubmitButton函数
    function updateSubmitButton() {
        if (commentContent.value.trim() === '') {
            commentSubmit.classList.remove('active');
            commentSubmit.disabled = true;
        } else {
            commentSubmit.classList.add('active');
            commentSubmit.disabled = false;
        }
    }

    function adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        const height = textarea.scrollHeight;
        if (height > textarea.clientHeight) {
            textarea.style.height = height + 'px';
        }
    }

    // 监听input的输入事件以更新button的状态
    commentContent.addEventListener('input', function() {
        updateSubmitButton();
        adjustTextareaHeight(this);
    });

    // 绑定发送按钮的点击事件
    if (commentSubmit) {
        commentSubmit.addEventListener('click', function() {
            if (currentPostId) {
                // 这里可以处理发送评论的逻辑
                console.log('帖子ID:', currentPostId);
                console.log('评论内容:', commentContent.value);
                // 在这里可以添加发送评论到服务器的代码
                
                // 清空输入框
                commentContent.value = '';
                updateSubmitButton();

            } else {
                console.error('未找到对应的帖子ID');
            }
        });
    }
})

// 处理文档点击事件的函数
function handleDocumentClick(event) {
    const target = event.target;
    const footerMenu = document.querySelector('.footer-menu');
    const commentPanel = document.querySelector('.comment-panel');
    const toggleButtons = document.querySelectorAll('.post-toggle-comment');

    // 检查点击目标是否是.post-toggle-comment按钮或其子元素
    let isToggleButtonOrChild = false;
    for (let i = 0; i < toggleButtons.length; i++) {
        if (toggleButtons[i].contains(target)) {
            isToggleButtonOrChild = true;
            break;
        }
    }

    if (!commentPanel.contains(target) && !isToggleButtonOrChild) {
        // 如果点击的目标不在.footer-menu内，且不是.post-toggle-comment按钮或其子元素，恢复原始内容
        commentPanel.classList.add('d-none');
        commentPanel.classList.remove('d-block');
        footerMenu.classList.add('d-flex');
        footerMenu.classList.remove('d-none');

        // 移除文档点击事件监听器，避免多次绑定
        document.removeEventListener('click', handleDocumentClick);
    }
}