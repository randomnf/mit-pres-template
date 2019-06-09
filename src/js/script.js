var DEBUG = window.parent.context === undefined;
/* префикс в id слайдов (id указывается в parameters.xml) */
var SLIDE_ID_PREFIX = "Merck__Rebif_1_2019__";
var SS_PREV_SLIDE_KEY = "Rebif_prevSlide";

/* меню */
var menuLinks = document.querySelectorAll(".menu-link");

for(var i = 0; i < menuLinks.length; i++)
{
    menuLinks[i].addEventListener("click", menuLinksHandler);
}

function menuLinksHandler(e)
{
    if (e)
    {
        e.preventDefault();
        e.stopPropagation();
    }

    var useTimeout = false;

    if ( this.classList.contains("menu-link-delayed") )
    {
        useTimeout = true;

        toggleDelayedLinks(this);
    }

    var menu = {
        "home": "0005",
        "instr": "0010",
        "liter": "0020",
    };

    var link = this.getAttribute("data-to");
        target = "";

    if ( link && (link in menu) )
    {
        target = menu[link];
    }

    if ( target !== "" && target !== null)
    {
        var slideName = SLIDE_ID_PREFIX + target;

        sessionStorage.setItem(SS_PREV_SLIDE_KEY, getCurrentSlide());

        console.log("'data-to' = ", link, "'to slide' = " + slideName);

        if (useTimeout) 
        {
            setTimeout(
                goToSlide,
                1000,
                slideName
            );
        }
        else
        {
            goToSlide(slideName);
        }
    }
}

function getPrevSlide() {
    return sessionStorage.getItem(SS_PREV_SLIDE_KEY);
}

function getCurrentSlide() {
    var body = document.querySelector(".body"),
        id = body.getAttribute("data-slide-id");

    if (id === undefined) id = "";

    return id;
}

function goToSlide(slide)
{
    if (DEBUG)
    {
        var a = slide.split(SLIDE_ID_PREFIX);
        window.location = "/slide_" + a[a.length - 1] + "/";
    }
    else
    {
        window.parent.navigateToSequence(slide);
    }
}

var goToPrevSlideBtn = document.querySelector(".js-back-btn");

if (goToPrevSlideBtn)
{
    goToPrevSlideBtn.addEventListener('click', function(e) {
        if (e)
        {
            e.preventDefault();
            e.stopPropagation();
        }

        goToSlide( getPrevSlide() );
    });
}

function toggleDelayedLinks(activeLink)
{
    var delayedLinks = document.querySelectorAll(".menu-link-delayed");

    for(var i = 0; i < delayedLinks.length; i++)
    {
        if (delayedLinks[i] !== activeLink)
        {
            delayedLinks[i].classList.add("menu-link-delayed_inactive");
        }
    }

    activeLink.classList.add("menu-link-delayed_active");
}

/* открытие попапов */
var popupBtns = document.querySelectorAll(".popup-btn"),
    popups = document.querySelectorAll(".popup"),
    popupCover = document.querySelector(".popup-cover"),
    popupCloseBtns = document.querySelectorAll(".popup__close-btn");

for(var i = 0; i < popupBtns.length; i++)
{
    popupBtns[i].addEventListener("click", popupOpenHandler);
}

function popupOpenHandler(e)
{
    if (e)
    {
        e.preventDefault();
        e.stopPropagation();
    }

    var target = this.getAttribute("data-target");

    hidePopups();
    togglePopupWrap(true);
    showPopupTarget(target);
}

function hidePopups()
{
    for(var i = 0; i < popups.length; i++)
    {
        popups[i].classList.add("popup_hidden");
    }
}

function togglePopupWrap(show)
{
    if (show)
    {
        popupCover.classList.remove("popup_hidden");
    }
    else
    {
        popupCover.classList.add("popup_hidden");
    }
}

function showPopupTarget(target)
{
    var targetPopups = document.querySelectorAll(".popup." + target);

    if (targetPopups.length)
    {
        for(var i = 0; i < targetPopups.length; i++)
        {
            targetPopups[i].classList.remove("popup_hidden");
        }
    }
}

/* закрытие попапов */
for(var i = 0; i < popupCloseBtns.length; i++)
{
    popupCloseBtns[i].addEventListener("click", popupCloseHandler);
}

popupCover.addEventListener("click", popupCloseHandler);

function popupCloseHandler(e)
{
    if (e)
    {
        e.preventDefault();
        e.stopPropagation();
    }

    hidePopups();
}

/* tabs */
var tabBtns = document.querySelectorAll(".tab-btn"),
    tabs = document.querySelectorAll(".tab");

for(var i = 0; i < tabBtns.length; i++)
{
    tabBtns[i].addEventListener('click', tabChangeHandler);
}

function tabChangeHandler(e)
{
    if (e)
    {
        e.preventDefault();
        e.stopPropagation();
    }

    var target = this.getAttribute("data-tab");

    closeTabs();
    showTab(target);
}

function closeTabs()
{
    for(var i = 0; i < tabs.length; i++)
    {
        tabs[i].classList.add("tab_hidden");
    }
}

function showTab(targetTab)
{
    var targetClass = ".tab." + targetTab,
        tab = document.querySelector(targetClass);
    
    if (tab)
    {
        tab.classList.remove("tab_hidden");
    }
}

/* показ pdf */
var pdfLinks = document.querySelectorAll(".pdf-link");

for(var i = 0; i < pdfLinks.length; i++)
{
    pdfLinks[i].addEventListener("click", pdfOpenHanlder);
}

function pdfOpenHanlder(e)
{
    if (e)
    {
        e.preventDefault();
        e.stopPropagation();
    }

    var pdfPath = this.getAttribute("data-pdf");

    window.parent.PDFHelper.OpenPDF(pdfPath, window, true);
}