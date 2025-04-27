document.addEventListener('DOMContentLoaded', function() {
  // Mobile navigation toggle
  const menuButton = document.querySelector('.menu-button');
  const navMenu = document.querySelector('nav ul');
  
  if (menuButton && navMenu) {
    menuButton.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!event.target.closest('nav') && !event.target.matches('.menu-button')) {
        navMenu.classList.remove('active');
      }
    });

    // Close menu when a link is clicked
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        navMenu.classList.remove('active');
      });
    });
  }

  // Add active class to current section in navigation
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('nav ul a');
  const homeLink = document.querySelector('nav ul a[href="#home"]'); // Get home link specifically
  
  window.addEventListener('scroll', function() {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      // const sectionHeight = section.clientHeight; // Not strictly needed for this logic
      if (window.scrollY >= sectionTop - 200) { 
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      // Check if the link's href matches the current section ID
      // Ensure href exists and extract the hash part correctly
      const linkHref = link.getAttribute('href');
      if (linkHref && linkHref.includes('#') && linkHref.split('#')[1] === current) {
        link.classList.add('active');
      }
    });

    // Special handling for home link when at the top
    if (window.scrollY < sections[0].offsetTop - 200) { // If above the first section
        navLinks.forEach(link => link.classList.remove('active')); // Deactivate others
        if (homeLink) {
            homeLink.classList.add('active'); // Activate home
        }
    } else if (!current && homeLink) { // Fallback if no section is 'current' but not explicitly at top
        // This case might need refinement depending on exact scroll behavior desired
        // For now, ensure home is active if no other section is
        let isActiveFound = false;
        navLinks.forEach(link => { if(link.classList.contains('active')) isActiveFound = true; });
        if (!isActiveFound) homeLink.classList.add('active');
    }
  });

  // Animate elements on scroll
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  
  function checkIfInView() {
    animateElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      if (elementTop < windowHeight - 100) {
        element.classList.add('animated');
      }
    });
  }
  
  // Initial check
  checkIfInView();
  
  // Check on scroll
  window.addEventListener('scroll', checkIfInView);
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"], a[href^="../#"]').forEach(anchor => { // Include links starting with ../#
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      
      // Check if it's an internal page link
      if (targetId.startsWith('#')) {
          e.preventDefault();
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop,
              behavior: 'smooth'
            });
          }
      } else if (targetId.startsWith('../#')) {
          // Handle links from blog page back to home page sections
          // This requires the link to navigate first, then potentially scroll.
          // Simple solution: let the browser handle navigation, scrolling won't be smooth.
          // For smooth scroll across pages, more complex JS is needed (not implemented here).
          // If the target is just '../#home', we might want to handle it specially if already on home.
          // For now, let the browser handle these links.
      }
    });
  });
  
  // Dark/Light mode toggle (if implemented)
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
      const isDarkMode = document.body.classList.contains('dark-mode');
      localStorage.setItem('dark-mode', isDarkMode);
    });
    
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('dark-mode');
    if (savedTheme === 'true') {
      document.body.classList.add('dark-mode');
    } else if (savedTheme === 'false') {
      document.body.classList.remove('dark-mode');
    }
  }

  // Set current year in footer
  const currentYearSpan = document.getElementById('current-year');
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }
});