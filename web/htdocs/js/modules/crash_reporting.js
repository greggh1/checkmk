// +------------------------------------------------------------------+
// |             ____ _               _        __  __ _  __           |
// |            / ___| |__   ___  ___| | __   |  \/  | |/ /           |
// |           | |   | '_ \ / _ \/ __| |/ /   | |\/| | ' /            |
// |           | |___| | | |  __/ (__|   <    | |  | | . \            |
// |            \____|_| |_|\___|\___|_|\_\___|_|  |_|_|\_\           |
// |                                                                  |
// | Copyright Mathias Kettner 2014             mk@mathias-kettner.de |
// +------------------------------------------------------------------+
//
// This file is part of Check_MK.
// The official homepage is at http://mathias-kettner.de/check_mk.
//
// check_mk is free software;  you can redistribute it and/or modify it
// under the  terms of the  GNU General Public License  as published by
// the Free Software Foundation in version 2.  check_mk is  distributed
// in the hope that it will be useful, but WITHOUT ANY WARRANTY;  with-
// out even the implied warranty of  MERCHANTABILITY  or  FITNESS FOR A
// PARTICULAR PURPOSE. See the  GNU General Public License for more de-
// tails.  You should have received  a copy of the  GNU  General Public
// License along with GNU Make; see the file  COPYING.  If  not,  write
// to the Free Software Foundation, Inc., 51 Franklin St,  Fifth Floor,
// Boston, MA 02110-1301 USA.

import * as ajax from "ajax";

//# +--------------------------------------------------------------------+
//# | Posting crash report to official Check_MK crash reporting API      |
//# '--------------------------------------------------------------------'

export function submit(url, post_data)
{
    document.getElementById("pending_msg").style.display = "block";

    if (has_cross_domain_ajax_support()) {
        ajax.call_ajax(url, {
            method           : "POST",
            post_data        : post_data,
            response_handler : handle_crash_report_response,
            error_handler    : handle_crash_report_error,
            handler_data     : {
                base_url: url
            }
        });
    }
    else if (typeof XDomainRequest !== "undefined") {
        // IE < 9 does not support cross domain ajax requests in the standard way.
        // workaround this issue by doing some iframe / form magic
        submit_with_ie(url, post_data);
    }
    else {
        handle_crash_report_error(null, null, "Your browser does not support direct crash reporting.");
    }
}

function has_cross_domain_ajax_support()
{
    return "withCredentials" in new XMLHttpRequest();
}

function submit_with_ie(url, post_data) {
    var handler_data = {
        base_url: url
    };
    var xdr = new window.XDomainRequest();
    xdr.onload = function() {
        handle_crash_report_response(handler_data, xdr.responseText);
    };
    xdr.onerror = function() {
        handle_crash_report_error(handler_data, null, xdr.responseText);
    };
    xdr.onprogress = function() {};
    xdr.open("post", url);
    xdr.send(post_data);
}


function handle_crash_report_response(handler_data, response_body)
{
    hide_crash_report_processing_msg();

    if (response_body.substr(0, 2) == "OK") {
        var id = response_body.split(" ")[1];
        var success_container = document.getElementById("success_msg");
        success_container.style.display = "block";
        success_container.innerHTML = success_container.innerHTML.replace(/###ID###/, id);
    }
    else {
        var fail_container = document.getElementById("fail_msg");
        fail_container.style.display = "block";
        fail_container.children[0].innerHTML += " ("+response_body+").";
    }
}

function handle_crash_report_error(handler_data, status_code, error_msg)
{
    hide_crash_report_processing_msg();

    var fail_container = document.getElementById("fail_msg");
    fail_container.style.display = "block";
    if (status_code) {
        fail_container.children[0].innerHTML += " (HTTP: "+status_code+").";
    }
    else if (error_msg) {
        fail_container.children[0].innerHTML += " ("+error_msg+").";
    }
    else {
        fail_container.children[0].innerHTML += " (Maybe <tt>"+handler_data["base_url"]+"</tt> not reachable).";
    }
}

function hide_crash_report_processing_msg()
{
    var msg = document.getElementById("pending_msg");
    msg.parentNode.removeChild(msg);
}

export function download(data_url)
{
    var link = document.createElement("a");
    link.download = "Check_MK_GUI_Crash-" + (new Date().toISOString()) + ".tar.gz";
    link.href = data_url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
