BSS
===

Summary
-------
Simple tool for quickly collating timesheet entries and tracking job numbers against them. The purpose is to make it easier to keep track of timesheet entries rather than writing them into a book by centralising their storage and aiding the assignment of job numbers to blocks of time. 

Requirements
------------
The entries are private to the user entering them.
The entries are editable.
If the user is offline, the entries can be added/edited/deleted and synced when back online.

Entries without a job number are highlighted.
Job numbers are referenced from an editable user specific pool.
Old job numbers can be marked for exclusion from search.
Job numbers are assigned to an entry by search on number or description.
Days are navigable by the user. The default day is today's date with future and past navigation possible.

Technologies used
-----------------
Firebase
Singly

Data Structure
--------------
Thanks to a great little online json editor <http://www.jsoneditoronline.org/>

	{
	    "config": {},
	    "users": {
	        "username": {
	            "password": "String",
	            "email": "String",
	            "field": "value",
	            "jobnumbers": {
	                "#": {
	                    "number": "String (unique)",
	                    "description": "String",
	                    "dateModified": "Number",
	                    "searchable": "Bool"
	                }
	            },
	            "days": {
	                "#": {
	                    "date": "Number (priority)",
	                    "entries": {
	                        "#": {
	                            "timeStart": "Number(priority)",
	                            "timeEnd": "Number",
	                            "jobnumberId": "Reference"
	                        }
	                    }
	                }
	            }
	        }
	    }
	}


