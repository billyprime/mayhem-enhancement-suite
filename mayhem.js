$(document).ready(function() {
    init_branding();
    init_navbar();
    init_pagetype();
});

/* Timeouts Helper */
var timeouts = [];
function clear_all_timeouts() {
  for(i in timeouts ){
    clearTimeout(timeouts[i]);
  }
}

/* Message Helper */
function flash_message(attach_point, message) {
    // Create the message
    message = $('<div class="mes-message">'+message+'</div>');

    // Remove any old messages
    attach_point.find('.mes-message').remove();

    // Append the new message
    attach_point.append(message);

    // Set a timer to remove the new message.
    setTimeout(function() {
        // Hide the new message first
        attach_point.find('.mes-message').hide(200, function() {
            // Then remove it when it's done.
            attach_point.find('.mes-message').remove();
        })
    }, 5000); // 5 second later.
}

function dialog(message) {
    var dialog_box = '<div class="mes-windowshade mes-dialog">\
        <div class="mes-dialog-outer" style="display:none;">\
            <div class="mes-dialog-inner">\
                <a href="#" title="close" class="closer">X</a>\
            </div>\
        </div>\
    </div>';

    dialog_box = $(dialog_box);
    dialog_box.find('.mes-dialog-inner').prepend(message);

    function close_dialog(e) {
        e.preventDefault();
        dialog_box.find('.mes-dialog-outer').hide(200, function() {
            dialog_box.remove();
        });
    }

    dialog_box.find('.closer').click(close_dialog);
    $('.mes-windowshade').click(close_dialog);

    $('body').append(dialog_box);
    dialog_box.find('.mes-dialog-outer').show(200);
}

// Nice jQuery regex selector.  Got it from here:
// http://james.padolsey.com/javascript/regex-selector-for-jquery/
$.expr[':'].regex = function(elem, index, match) {
    var matchParams = match[3].split(','),
        validLabels = /^(data|css):/,
        attr = {
            method: matchParams[0].match(validLabels) ?
                        matchParams[0].split(':')[0] : 'attr',
            property: matchParams.shift().replace(validLabels,'')
        },
        regexFlags = 'ig',
        regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g,''), regexFlags);
    return regex.test(jQuery(elem)[attr.method](attr.property));
}

/* Determine what page we're on */
var pagetype = '';
function init_pagetype() {
    var path = window.location.pathname

    if( path == '/' ) {
        pagetype = 'home';
    }
    else if(/^\/(member.php\?id=)?([0-9]+)$/.exec(path)) {
        pagetype = 'member';
    }
    else if(/^\/portfolio\/([0-9]+)/.exec(path)) {
        pagetype = 'photo_list';
    }
    else if(/^\/portfolio\/pic\/([0-9]+)/.exec(path)) {
        pagetype = 'photo_detail';
    }
    else if(/^\/comments\/add_new_comment\//.exec(path)) {
        pagetype = 'add_comment';
    }
    else if(/^\/tags\/([0-9]+)/.exec(path)) {
        pagetype = 'tags';
    }
    else if(/^\/browse\//.exec(path)) {
        pagetype = 'search';
    }
    else if(false) {
        pagetype = 'forum';
    }
    $('body').trigger('pageload.'+pagetype);
}

/* Storage Handlers */
function get_val(name, callback) {
    var param_name = name;
    get_values = {};
    get_values[param_name] = '';
    chrome.storage.local.get(get_values, function(values) {
        value = values[param_name]
        callback(value);
    });
}

function get_vals(names, callback) {
    get_values = {};
    for(i in names) {
        name = names[i];
        get_values[name] = '';
    }

    chrome.storage.local.get(get_values, function(values) {
        callback(values);
    });
}

function set_val(name, rank) {
    var param_name = name;

    set_vals = {}
    set_vals[param_name] = rank;

    chrome.storage.local.set(set_vals, function() {
        //get_val(param_name, function(value) { console.log(param_name, value); });
    });
}

/* Branding */
function init_branding() {
    $('.header-n').next().after('<span class="mes-branding">enhanced</span>');
}

/* Ranks */
var ranks = {
    'omfgyes': 'OMFG Yes',
    'yes': 'Yes',
    'maybe': 'Maybe',
    'no': 'No',
    'hide': 'Hide'
}

function iterate_pic_wrappers(wrappers, find_name_elm, find_type_elm) {
    var matcher = /([0-9]+)$/;

    wrappers.each( function(i, elm) {
        elm = $(elm);
        var link = elm.find('a').first();

        var container = elm;

        if(link.length) {
            var member_id = matcher.exec( $(link).attr('href') )[1];
            var param_name = 'member_rank_'+member_id;

            var name = find_name_elm(elm);
            if(!name.length) {
                name = $(link);
                container = elm;
            }

            var type = find_type_elm(elm);

            container.addClass(type);

            name.parent().append(get_rank_select(member_id));
            container.addClass(type);
            container.attr('id', 'member-'+member_id);

            get_val(param_name, function(value) {
                var rank = 'rank-unranked';
                if(value) {
                    rank = 'rank-'+value.toLowerCase();
                }
                container.addClass(rank);
            });
        }
    });
}

function init_vips() {
    if($('.vipStarsBlock').length) {
        var wrappers = $('.vipStarsBlock td')

        if(wrappers.children().length > 0) {
            var labels = $('.vipStarsBlock #MemberInfo td');
            $('.vipStarsBlock .vipStarImg td').each(function(i, elm) {
                $(labels[i]).prepend($(elm).html());
            });
            $('.vipStarsBlock .vipStarImg').remove();


            iterate_pic_wrappers(wrappers,
                function(elm) { return elm.find('.small strong') },
                function(elm) { return 'type-'+elm.find('font').text().toLowerCase().replace(' ', '-').replace('/', '-'); }
            );
        }
        else {
            // Retry, announcements aren't loaded yet.
            clearTimeout(timeouts['init_vips']);
            timeouts['init_vips'] = window.setTimeout(init_vips, 500);
        }

    }
}
/* Binding */
$('body').bind('pageload.home', init_vips);

function init_announcements() {
    if($('#announcementsArea').length) {
        var wrappers = $('#announcementsArea tr');

        // First, cleanup - remove the spacers.
        $('#announcementsArea table tr:odd').remove();

        if(wrappers.children().length > 0) {
            iterate_pic_wrappers(wrappers,
                function(elm) { return elm.find('.small strong') },
                function(elm) { return 'type-'+elm.find('font').text().toLowerCase().replace(' ', '-').replace('/', '-'); }
            );
        }
        else {
            // Retry, announcements aren't loaded yet.
            clearTimeout(timeouts['init_announcements']);
            timeouts['init_announcements'] = window.setTimeout(init_announcements, 500);
        }
    }
}
/* Binding */
$('body').bind('pageload.home', init_announcements);

function init_search_results() {
    if($('.bResultWraper').length) {
        var rows = $('.bResultWraper .bInfoWraper');


        var matcher = /([0-9]+)$/;

        if(rows.length) {
            iterate_pic_wrappers(
                rows,
                function(elm) { return elm.find('.bMemberData a.bold') },
                function(elm) { return elm.find('.bAvatar div') }
            );

            // rows.each( function(i, elm) {
//                 elm = $(elm);
//                 var link = $(elm.find('.bAvatar a').first());
//                 var member_id = matcher.exec( $(link).attr('href') )[1];
//
//                 var name = elm.find('.bMemberData td:first-child a');
//
//                 name.parent().append(get_rank_select(member_id));
//             });
        }
        else {
            // Retry, results aren't loaded yet.
            clear_all_timeouts();
            timeouts.push(window.setTimeout(init_search_results, 500));
        }

    }
}
/* Binding */
$('body').bind('pageload.search', init_search_results);

function init_main_member() {
    // This one is easy.  Maybe a little too easy.

    // Just get the member_id from the url.
    var path = window.location.pathname;

    var memberpage_regex = /^\/(member.php\?id=)?([0-9]+)/;
    var member_id = memberpage_regex.exec(path)[2];

    var name = $('#main_container_content h1');

    name.after(get_rank_select(member_id));
}
/* Binding */
$('body').bind('pageload.member', init_main_member);

function init_toptwelve() {
    var friend_container = $('.head:contains("Friends")').first().next();
    var matcher = /([0-9]+)$/;

    if(friend_container.length) {
        var friends = friend_container.find('#pic_wrapper');
        friends.each( function(i, elm) {
            elm = $(elm);
            var link = elm.find('a[href^="/member.php?id="]');

            if(link.length) {
                var member_id = matcher.exec( $(link).attr('href') )[1];
                var name = elm.find('.small strong');

                name.parent().append(get_rank_select(member_id));
            }
        });
    }
}
/* Binding */
$('body').bind('pageload.member', init_toptwelve);

function init_tags() {
    var tags = $('#tags .tag'); // That was nice of them.
    var matcher = /([0-9]+)$/;

    if(tags.length) {
        tags.each( function(i, elm) {
            elm = $(elm);
            var link = elm.find('a:regex(href, ^/[0-9]+$)');

            if(link.length) {
                var member_id = matcher.exec( $(link).attr('href') )[1];
                var name = elm.find('strong.small');
                name.parent().append(get_rank_select(member_id));
            }

        });
    }
    else {
        // Retry, tags aren't loaded yet.
        clear_all_timeouts();
        timeouts.push(window.setTimeout(init_tags, 500));
    }
}
/* Binding */
$('body').bind('pageload.member', init_tags);
$('body').bind('pageload.tags', init_tags);

function tags_pagination_reinit() {
    // There's already a click handler, so we just want to add another.
    // We don't have access to the load event directly,
    // so we just guess.
    $('.strPagination a').live('click', function() {
        clear_all_timeouts();
        timeouts.push(window.setTimeout(init_tags, 500));
        timeouts.pus(window.setTimeout(tags_pagination_reinit, 500));
    });
}
/* Binding */
$('body').bind('pageload.tags', tags_pagination_reinit);

function get_rank_select(id) {
    var param_name = 'member_rank_'+id;
    var selector = $('<select class="rank" id="'+param_name+'"></select>');

    // Default of none.
    selector.append(get_option());
    // Add rank
    for(i in ranks) {
        selector.append(get_option(i, ranks[i]));
    }

    get_val(param_name, function(value) {
        if(value) {
            selector.val(value);
        }
    });
    selector.change( handle_selection );

    return $('<div class="rank-selector"></div>').append(selector);
}

function get_option(val, name) {
    if(!val || !val.length) {
        val = '';
        name = ' - ';
    }
    return $('<option value="'+val+'">'+name+'</option>');
}

handle_selection = function() {
    rank = $(this).val();
    param_name = $(this).attr('id');
    set_val(param_name, rank);
}

/* Nav Bar */
function init_navbar() {
    // Only if we're logged in.
    if($('#bg_wrap .header-n .welcome').text().trim().length) {
        // Logged in
        var navbar = $('#bg_wrap .header-n');

        var nav_options = navbar.children('.option');

        var message_count = 0;
        if(nav_options.children('a[href="http://www.modelmayhem.com/mystuff/0/unread"]').length) {
            message_count = $.trim(nav_options.contents()[0].nodeValue);
        }


        var link = navbar.find('.welcome a').attr('href');
        var memberpage_regex = /\/(member.php\?id=)?([0-9]+)$/;

        var member_id = memberpage_regex.exec(link)[2];

        // Build a new menu entirely.

        var nav = '<nav id="mes-main-nav">\
            <ul>\
                <li class="mes-home">\
                    <a href="/">Home</a>\
                </li>\
                <li class="mes-account">\
                    <a href="#mes-account-nav" class="toggle">Account</a>\
                    <ul id="mes-account-nav" class="mes-nav-list">\
                        <li>\
                            <a href="/mystuff/">Inbox</a>\
                        </li>\
                        <li>\
                            <a href="/'+member_id+'">View Profile</a>\
                        </li>\
                        <li>\
                            <a href="/mystuff/profile/edit">Edit Profile</a>\
                        </li>\
                        <li>\
                            <a href="/mystuff/manage_photos/">Manage Photos</a>\
                        </li>\
                        <li>\
                            <a href="/tags/'+member_id+'">Tags</a>\
                        </li>\
                        <li>\
                            <a href="/mystuff/settings">Settings</a>\
                        </li>\
                        <li>\
                            <a href="/logout">Logout</a>\
                        </li>\
                    </ul>\
                </li>';
        if(message_count) {
            nav += '<li class="mes-message-icon">\
                <a href="http://www.modelmayhem.com/mystuff/0/unread" class="mes-unread-link" \
                    ><img src="http://mms.ibsrv.net/images/envelope.gif" border="0" alt="Unread Messages">\
                    '+message_count+'\
                </a>\
            </li>';
        }

        nav += '<li class="mes-people has-children">\
                    <a href="#mes-people-nav" class="toggle">Friends</a>\
                    <ul id="mes-people-nav" class="mes-nav-list">\
                        <li>\
                            <a href="/mystuff/friend_requests">Friend Requests</a>\
                        </li>\
                        <li>\
                            <a href="/mystuff/friends/">Friends</a>\
                        </li>\
                        <li>\
                            <a href="/mystuff/friends/topfriends">Top 12</a>\
                        </li>\
                        <li>\
                            <a href="/mystuff/favorites/">Favorites</a>\
                        </li>\
                        <li>\
                            <a href="/mystuff/manage_list/">Lists</a>\
                        </li>\
                    </ul>\
                </li>\
                <li class="mes-announce has-children">\
                    <a href="#mes-announcement" class="toggle">Announce</a>\
                    <ul id="mes-announcement" class="mes-nav-list">\
                        <li>\
                            <form action="/announce/save" method="post" id="mini-announce-form">\
                    		    <input type="text" name="announcement" size="70" maxlength="230">\
                        		<input name="vip_status" type="hidden" value="1">\
                        		<input name="submit" type="submit" value="Go">\
                            </form>\
                        </li>\
                    </ul>\
                </li>\
                <li class="mes-settings">\
                    <a href="mes-settings" id="mes-settings-link">Settings</a>\
                </li>\
                <li class="mes-logout">\
                    <a href="/help">Help</a>\
                </li>\
                <li class="mes-about">\
                    <a id="mes-about-link" href="#">MES</a>\
                </li>\
            </ul>\
        </nav>';

        nav = $(nav);

        navbar.empty().append(nav);

        nav.find('.toggle').click( function(e) {
            e.preventDefault();
            var id = $(this).attr('href');

            var elm = $(id);

            $('.mes-nav-list').not(elm).hide(100);
            elm.toggle(100);

            if(id == '#mes-announcement') {
                $('#mini-announce-form input[name="announcement"]').focus();
            }
        });

        $('#mini-announce-form').submit(function(e) {
            e.preventDefault();

            var form = $(this);
            form.addClass('mes-loading');
            form.find('input[type="submit"]').css('opacity', '0');

            var url = $('#mini-announce-form').attr('action');
            var data = $('#mini-announce-form').serialize();

            $.post(url, data, function(content, textStatus, jqXHR) {
                var failmessage = /You must wait ([0-9]) minute\(s\) before making another announcement./;
                failure = failmessage.exec(content);

                form.removeClass('mes-loading');
                form.find('input[type="submit"]').css('opacity', '1');

                if(failure) {
                    if(failure[1] == '1') {
                        var minutes = '1 minute';
                    }
                    else {
                        var minutes = failure[1]+' minutes';
                    }
                    var message = 'Please wait '+minutes+'.';

                    flash_message($('#mini-announce-form'), message);
                    setTimeout(function(){ $('#mes-announcement').hide(200); }, 5000);
                }
                else {
                    flash_message($('#mini-announce-form'), 'Posted!');
                    form.find('input[type="text"]').val("");
                    setTimeout(function(){ $('#mes-announcement').hide(200); }, 5000);
                }
            });
        });

        var about_message = '<div id="mes-about">\
            <h2 class="mes-title">Mayhem Enhacement Suite</h2>\
            <p>\
                Mayhem Enhancement Suite was created by\
                <a href="http://billyprime.com/" target="_blank">Billy Prime</a>\
                (<a href="http://www.modelmayhem.com/228903" target="_blank">#228903</a>)\
            </p>\
            <p>\
                Mayhem Enhancement Suite is not in any way affiliated\
                with Model Mayhem or Internet Brands, Inc.\
            </p>\
            <p>\
                This software is provided as-is with no\
                warranty under the \
                <a href="http://opensource.org/licenses/bsd-license.php" target="_blank">BSD \
                license</a>.  Use at your own risk.\
            </p>\
        </div>';


        nav.find('#mes-about-link').click(function(e) {
            e.preventDefault();
            dialog(about_message);
        });

        var settings_box = '<h2 class="mes-title">Settings</h2>\
            <div id="mes-settings">\
                <ul class="tabs">\
                    <li class="active">\
                        <a href="#mes-settings-hidden">Hidden</a>\
                    </li>\
                </ul><div class="panes">\
                    <div class="pane active" id="mes-settings-hidden">\
                    </div>\
                </div>\
            </div>';

        settings_box = $(settings_box);

        var rank_options = {
            'hide-yes': 'Yes',
            'hide-maybe': 'Maybe',
            'hide-no': 'No',
            'hide-hide': 'Hide'
        };

        var type_options = {
            'hide-photographer': 'Photographer',
            'hide-model': 'Model',
            'hide-digital-artist': 'Digital Artist',
            'hide-retoucher': 'Retoucher',
            'hide-body-painter': 'Body Painter',
            'hide-artist-painter': 'Artist/Painter',
            'hide-wardrobe-stylist': 'Wardrobe Stylist',
            'hide-publication': 'Publication',
            'hide-filmmaker': 'Filmmaker',
            'hide-approved-agency': 'Approved Agency',
            'hide-event-planner': 'Event Planner',
            'hide-casting-director': 'Casting Director',
            'hide-advertiser': 'Advertsier'
        };

        var rank_checkboxes = build_options(rank_options);
        var type_checkboxes = build_options(type_options);

        settings_box.find('#mes-settings-hidden')
            .append('<h3>Hide these Ranks</h3>')
            .append(rank_checkboxes)
            .append('<h3>Hide these Member Types</h3>')
            .append(type_checkboxes);


        nav.find('#mes-settings-link').click(function(e) {
            e.preventDefault();

            dialog(settings_box);
        });

    }
    else {
        // Logged out
    }
}

function build_options(options) {
    var options = options;
    var content = $('<ul class="mes-options"></ul>');

    var names = []
    for(name in options) {
        names.push('mes-'+name);
    }
    get_vals(names, function(values) {
        for(name in options) {
            var label = options[name];
            var id = 'mes-'+name;

            var container = $('<li></li>');

            var checkbox = $('<input type="checkbox"/>');
            checkbox.attr('id', id);
            checkbox.attr('name', name);
            checkbox.attr('value', '1');
            if(values[id]) {
                $('body').addClass(name);
                checkbox.prop('checked', 'checked');
            }
            else {
                $('body').removeClass(name);
            }
            checkbox.change(function(e) {
                elm = $(this);

                if($(this).prop('checked')) {
                    val = elm.val();
                    $('body').addClass(elm.attr('name'));
                }
                else {
                    val = '';
                    $('body').removeClass(elm.attr('name'));
                }
                set_val(elm.attr('id'), val);
            });

            var label = $('<label for="mes-'+name+'">'+label+'</label>');

            container.append(checkbox, label);

            content.append(container);
        }
    });


    // We return the content before the content is filled.  Magic.
    return content;
}

function photo_list_submenu() {
    var table = $('#main_container_content table').first();
    table.addClass('mes-submenu');

    /* This is a bit brittle, but works for now. */

    var tds = table.find('td');

    // Get the name, then remove it.
    var right_col = tds.last();
    var name = right_col.find('a strong').first().text().trim();
    right_col.find('a strong').first().parent().remove();

    var left_col = tds.first();
    // Set the title of the Profile link to the user's name.
    left_col.find('a').first().text(name);

    // Move the Credited Photos to the left
    left_col.append(
        $('<div></div>').append(right_col.find('a strong').first().parent())
    );

    // Get rid of the fluff
    right_col.html(right_col.html().replace(/Back to profile:(\s*<br>)+/, ''));

    // Shorten the titles
    right_col.html( right_col.html().replace(/Toggle Worksafe Mode/, 'Worksafe') );

    // Add the rank selector
    var matcher = /([0-9]+)$/;
    var member_id = matcher.exec( left_col.find('a').first().attr('href') )[1];
    var rank_select = $('<div class="mes-rank-box"></div>').append(get_rank_select(member_id));
    left_col.append(rank_select);

    /* Rebuild Galleries */
    var gallery = $('.albumProfolio');
    var new_gallery = $('<ul></ul>');

    var galleries = gallery.find('td.portfolioIcon');

    if(galleries.length > 0) {
        galleries.each( function(i, elm) {
            new_gallery.append($('<li></li>').html( $(elm).html() ));
        });

        table.after($('<div class="mes-gallery-thumbs"></div>').append(new_gallery));
    }
    gallery.remove();
    $('.head_top.albumBlockHeader').first().remove();
}
/* Binding */
$('body').bind('pageload.photo_list', photo_list_submenu);

function photo_detail_submenu() {
    var table = $('#main_container_content table').first();
    table.addClass('mes-submenu');

    /* This is a bit brittle, but works for now. */

    var tds = table.find('td');

    var left_col = tds.first();

    // Add the rank selector
    var matcher = /([0-9]+)$/;
    var member_id = matcher.exec( left_col.find('a').first().attr('href') )[1];
    var rank_select = $('<div class="mes-rank-box"></div>').append(get_rank_select(member_id));
    left_col.append(rank_select);

    var right_col = tds.last();

    // Replace all the links with icons
    var report_link = right_col.find('a[href^="/report"]');
    report_link.addClass('mes-icon-link');
    report_link.addClass('mes-flag-user-link');
    report_link.attr('title', 'Report Image');
    report_link.next('br').remove();

    var share_link = right_col.find('a[href^="/share_pic/"]');
    share_link.addClass('mes-icon-link');
    share_link.addClass('mes-email-link');
    share_link.attr('title', 'Email This Image');
    share_link.next('br').remove();

    var list_link = right_col.find('a[href^="/list/add_to_list/"]');
    list_link.addClass('mes-icon-link');
    list_link.addClass('mes-add-to-list-link');
    list_link.attr('title', 'Add to List');

    // Strip those trailing BRs
    right_col.html( right_col.html().replace(/(\s*<br>)+\s*$/, '') );

    // Shorten the titles
    right_col.html( right_col.html().replace(/Toggle Worksafe Mode/, 'Worksafe') );
}
/* Binding */
$('body').bind('pageload.photo_detail', photo_detail_submenu);

function init_credits() {
    $('#pic_credits').html(
        $('#pic_credits').html().replace(/\(|\)/g,'')
    );
    var links = $('#pic_credits').first().find('a');
    var matcher = /([0-9]+)$/;

    links.each( function (i, elm) {
        var link = $(elm);
        var member_id = matcher.exec( link.attr('href') )[1];
        link.next().after(get_rank_select(member_id));
    });
}
/* Binding */
$('body').bind('pageload.photo_detail', init_credits);

function init_comments() {
    var wrappers = $('.commentstable');

    if(wrappers.children().length > 0) {
        iterate_pic_wrappers(wrappers,
            function(elm) { return elm.find('.small strong') },
            function(elm) { return $() /* There is no type on comments.  Boo. */ }
        );

    }
    else {
        // Retry, comments aren't loaded yet.
        clearTimeout(timeouts['init_comments']);
        timeouts['init_comments'] = window.setTimeout(init_comments, 500);
    }
}
/* Binding */
$('body').bind('pageload.photo_detail', init_comments);

function init_paging() {
    // We have to inject event handling code into the page to
    // Use the native click handlers.
    var inject_script = "$(document).keydown(function(e) { if (e.keyCode == 37) { console.log('prev'); $('a.prev').click(); } else if(e.keyCode == 39) { console.log('next'); $('a.next').click(); }});";

    var s = document.createElement('script');
    s.textContent = inject_script;
    s.onload = function() {
        this.parentNode.removeChild(this);
    };
    document.head.appendChild(s);
}
/* Binding */
$('body').bind('pageload.photo_detail', init_paging);

//  *
//   *
// ***

