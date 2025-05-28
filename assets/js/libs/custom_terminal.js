jQuery(function($, undefined) {
    var term = $('#terminal').terminal(function(command, term) {
        const parts = command.toLowerCase().split(' ');
        const cmd = parts[0];
        const args = parts.slice(1); // Get arguments if any

        if (cmd === 'help') {
            term.echo('Available commands:');
            term.echo('  resume                - View my professional resume');
            term.echo('  blog                  - Navigate to my blog posts');
            term.echo('  social                - Display social media links');
            term.echo('  about                 - A little about this site');
            term.echo('  contact               - How to reach me');
            term.echo('  theme [light|dark]    - Change terminal theme (optional feature)');
            term.echo('  clear                 - Clear the terminal screen');
            term.echo('  welcome               - Display the welcome message');
        } else if (cmd === 'resume') {
            term.echo('Redirecting to resume...');
            window.location.href = '{{ "/pages/resume" | relative_url }}';
        } else if (cmd === 'blog') {
            term.echo('Redirecting to blog...');
            window.location.href = '{{ "/pages/blog" | relative_url }}';
        } else if (cmd === 'social') {
            term.echo('Connect with me:');
            term.echo('  GitHub:   <a href="https://github.com/{{ site.github_username }}" target="_blank">github.com/{{ site.github_username }}</a>', { raw: true });
            term.echo('  LinkedIn: <a href="https://linkedin.com/in/your-profile-url" target="_blank">linkedin.com/in/your-profile-url</a> (Update this!)', { raw: true });
            // Add more social links - make sure to use { raw: true } for HTML links
        } else if (cmd === 'about') {
            term.echo('This site hosts my resume and blog.');
            term.echo('Built with Jekyll and GitHub Pages, styled with a terminal interface.');
            term.echo('Type "help" for a list of commands.');
        } else if (cmd === 'contact') {
            term.echo('You can reach me at: <a href="mailto:{{ site.email }}">{{ site.email }}</a>', { raw: true });
        } else if (cmd === 'theme') {
            if (args.length > 0) {
                if (args[0] === 'dark') {
                    term.echo('Setting theme to dark...');
                    // You would need CSS classes for themes
                    $('body').removeClass('light-theme').addClass('dark-theme');
                } else if (args[0] === 'light') {
                    term.echo('Setting theme to light...');
                    $('body').removeClass('dark-theme').addClass('light-theme');
                } else {
                    term.error('Unknown theme. Use "light" or "dark".');
                }
            } else {
                term.echo('Usage: theme [light|dark]');
            }
        } else if (cmd === 'clear') {
            term.clear();
            term.echo(this.get_prompt() + 'welcome'); // Re-display welcome after clear for context
            welcomeMessage(term);
        } else if (cmd === 'welcome') {
            welcomeMessage(term);
        } else if (command.trim() !== '') {
            term.error('Command not found: ' + command + '. Type "help" for available commands.');
        }
    }, {
        greetings: false, // We will call our own welcome message
        prompt: 'guest@{{ site.title | downcase | replace: " ", "-" }}:~$ ',
        name: 'web_terminal',
        height: '80vh', // Make terminal take most of the viewport height
        onInit: function(term) {
            welcomeMessage(term);
            // Auto-focus the terminal on load
            term.focus(true);
        },
        keymap: {
            'CTRL+C': function(e, original) { // Allow copy
                if (!term.paused() && document.getSelection().toString()) {
                    return; // if there is selection, allow normal copy
                }
                // otherwise, if your version of term support it.
                // term.send(''); // send SIGINT - this might interrupt the current command
                term.echo('[[;red;]Ctrl+C pressed. Type "exit" or close tab to leave.]');
            }
        },
        processArguments: function(command) {
            // This allows commands with spaces if they are quoted
            return $.terminal.parse_arguments(command);
        },
        outputLimit: 100, // Number of lines to keep in output
        historySize: 200, // Number of commands to keep in history
        scrollOnOutput: true,
        convertLinks: true, // Automatically convert URLs to links
    });

    function welcomeMessage(termInstance) {
        termInstance.echo('[[b;cyan;]Welcome to {{ site.title }}!]', { raw: false }); // Use raw:false for JQuery Terminal formatting
        termInstance.echo('Type `[[b;white;]help` to see a list of available commands.');
        termInstance.echo('---');
    }

    // Make terminal responsive to window resize
    $(window).resize(function() {
        // Consider adjusting terminal height or other properties if needed
        // For instance, if you have a fixed header/footer outside the terminal
        var newHeight = $(window).height() * 0.8; // Example: 80% of window height
        if (term) {
           // term.resize(term.width(), newHeight); // May not be needed if height is CSS driven via vh
        }
    });
});