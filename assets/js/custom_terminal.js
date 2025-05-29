jQuery(function($, undefined) {
    // siteConfig is now available globally from the script tag in default.html
    var term = $('#terminal').terminal(function(command, term) {
        const parts = command.toLowerCase().split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        if (cmd === 'help') {
            term.echo('Available commands:');
            term.echo('  resume                - View my professional resume');
            term.echo('  blog                  - Navigate to my blog posts');
            term.echo('  social                - Display social media links');
            term.echo('  about                 - A little about this site');
            term.echo('  contact               - How to reach me');
          //term.echo('  theme [light|dark]    - Change terminal theme'); // Keep if you implement themes
            term.echo('  clear                 - Clear the terminal screen');
            term.echo('  welcome               - Display the welcome message');
        } else if (cmd === 'resume') {
            term.echo('Redirecting to resume...');
            window.location.href = siteConfig.baseurl + siteConfig.resume_url;
        } else if (cmd === 'blog') {
            term.echo('Redirecting to blog...');
            window.location.href = siteConfig.baseurl + siteConfig.blog_url;
        } else if (cmd === 'social') {
            term.echo('Connect with me:');
            term.echo('  GitHub:   <a href="https://github.com/' + siteConfig.github_username + '" target="_blank">github.com/' + siteConfig.github_username + '</a>', { raw: true });
            term.echo('  LinkedIn: <a href="https://linkedin.com/in/your-profile-url" target="_blank">linkedin.com/in/your-profile-url</a> (Update this!)', { raw: true });
        } else if (cmd === 'about') {
            term.echo('This site hosts my resume and blog.');
            term.echo('Built with Jekyll and GitHub Pages, styled with a terminal interface.');
            term.echo('Type "help" for a list of commands.');
        } else if (cmd === 'contact') {
            term.echo('You can reach me at: <a href="mailto:' + siteConfig.email + '">' + siteConfig.email + '</a>', { raw: true });
        } else if (cmd === 'clear') {
            term.clear();
            welcomeMessage(term); // Re-display welcome after clear
        } else if (cmd === 'welcome') {
            welcomeMessage(term);
        } else if (command.trim() !== '') {
            term.error('Command not found: ' + command + '. Type "help" for available commands.');
        }
    }, {
        greetings: false, // We call our own welcome message
        prompt: 'guest@' + siteConfig.title.toLowerCase().replace(/ /g, '-') + ':~$ ',
        name: 'web_terminal',
        height: 'calc(100vh - 40px)', // Adjust to fit nicely, leave some padding
        onInit: function(term) {
            welcomeMessage(term);
            term.focus(true);
        },
        // Ensure cursor is a blinking block
        // Check jQuery Terminal documentation for the most current way to set cursor style.
        // It might be an option like `cursorBlink: true, cursorStyle: 'block'` or similar,
        // or it might be purely CSS driven with newer versions.
        // For now, we'll rely on CSS.
        convertLinks: true,
        historySize: 200,
        scrollOnOutput: true,
        outputLimit: 100
    });

    function welcomeMessage(termInstance) {
        // Use raw: false for JQuery Terminal formatting if not using HTML tags
        termInstance.echo('[[b;화이트;]Welcome to ' + siteConfig.title + '!]', {raw: false});
        termInstance.echo('Type `[[b;화이트;]help` to see a list of available commands.');
        termInstance.echo('---');
    }

    $(window).resize(function() {
        // Optional: You might want to adjust terminal height or properties on resize
        // if the vh unit doesn't behave perfectly with mobile browser chrome.
    });
});