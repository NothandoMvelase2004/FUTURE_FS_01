var tablinks = document.getElementsByClassName("tab-links");
    var tabcontents = document.getElementsByClassName("tab-contents");
    function opentab(tabname){
        for(tablink of tablinks){
            tablink.classList.remove("active-link");
        }
        for(tabcontent of tabcontents){
            tabcontent.classList.remove("active-tab");
        }
        event.currentTarget.classList.add("active-link")
        document.getElementById(tabname).classList.add("active-tab")
    }

var sidemenu = document.getElementById("sidemenu");
    function openmenu(){
        sidemenu.style.right = "0";
    }
    function closemenu(){
        sidemenu.style.right = "-200";
    }


document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        fetch('contact.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            const msgSpan = document.getElementById('msg');
            msgSpan.textContent = data;
            msgSpan.style.display = 'block';
            
            this.reset();
            
            setTimeout(() => {
                msgSpan.style.display = 'none';
            }, 5000);
        })
        .catch(error => {
            console.error('Error:', error);
            const msgSpan = document.getElementById('msg');
            msgSpan.textContent = 'An error occurred. Please try again.';
            msgSpan.style.display = 'block';
            setTimeout(() => {
                msgSpan.style.display = 'none';
            }, 5000);
        });
    });
