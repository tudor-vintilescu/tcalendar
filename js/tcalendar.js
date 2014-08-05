

(function($, moment, _, Handlebars) {

    var currentMoment = moment();

    var nominatedIntervals = [];
    var targetElement;

    var pendingClickedMoment;

    var pendingInterval;

    var calendarTemplate = Handlebars.compile(
        '<div class="tcalendar">\
            <div class="tcalendar-header">\
                <div class="date-part pull-left arrow previous-month"><span class="glyphicon glyphicon-chevron-left"></span></div>\
                <select class="date-part month-part">\
                    {{#each displayMonths}}\
                        <option {{#if selected}}selected{{/if}} value={{monthIndex}}>{{month}}</option>\
                    {{/each}}\
                </select>\
                <select class="date-part year-part">\
                    {{#each displayYears}}\
                        <option {{#if selected}}selected{{/if}} value={{year}}>{{year}}</option>\
                    {{/each}}\
                </select>\
                <div class="date-part pull-right arrow next-month"><span class="glyphicon glyphicon-chevron-right"></span></div>\
            </div>\
            <table class="tcalendar">\
                <tr>\
                {{#each weekDays}}\
                    <th>{{name}}</th>\
                {{/each}}\
                </tr>\
                <tbody>\
                {{#each weeks}}\
                <tr>\
                    {{#each week}}\
                    <td class="{{date}}"><a {{#unless inMonth}}class="not-in-month"{{/unless}} href="#">{{date}}</a></td>\
                    {{/each}}\
                </tr>\
                {{/each}}\
                </tbody>\
            </table>\
        </div>'
    );

    function getMonthBounds(year, month) {
        var firstDay = moment([year, month, 1]);

        var lastDay = moment([year, month + 1, 1]).subtract(1, 'day');

        return { firstDay : firstDay, lastDay : lastDay };
    }

    function generateCalendarMonth() {

        var year = currentMoment.year();
        var month = currentMoment.month();

        var bounds = getMonthBounds(year, month);

        var firstDay = moment(bounds.firstDay);
        var lastDay = moment(bounds.lastDay);

        firstDay = moment(firstDay.weekday(0));
        lastDay = moment(lastDay.weekday(7));

        var currentDay = moment(firstDay);

        var result = [];

        while (currentDay.isBefore(lastDay)) {

            result.push({
                momentDate : moment(currentDay),
                inMonth : (currentDay.month() === bounds.firstDay.month())
            });
            currentDay = currentDay.add(1, 'day');
        }

        return {
            calendarMonth : result,
            firstDay : bounds.firstDay
        };

    }

    function getDisplayYears() {
        var rightNow = moment();

        return _.map(_.range(rightNow.year() - 6, rightNow.year() + 6),
            function(elem){
                return { year : elem, selected : ( elem === currentMoment.year() ) };
            });
    }

    function getDisplayMonths() {
        var rightNow = moment();

        return _.map(_.range(0, 12), function(element){
            var mom = moment([rightNow.year(), element]);

            return {
                month : mom.format('MMM'),
                monthIndex : mom.month(),
                selected : ( mom.month() === currentMoment.month() )
            };
        });
    }

    function formatCalendarMonth(calendarMonth) {

        var days = _.map(calendarMonth.calendarMonth, function(dt){
            return  {
                date : dt.momentDate.date(),
                inMonth : dt.inMonth,
                moment : dt.momentDate
            }
        });

        var weeks = _.map(_.values(_.groupBy(days, function(el, idx){
            return Math.floor(idx / 7);
        })), function(el){
            return { week : el };
        });

        var finalResult = {
            weekDays : _.map(weeks[0].week, function(el) {
                return { name : el.moment.format('ddd').toUpperCase() };
            }),
            weeks : weeks,
            month : calendarMonth.firstDay.format('MMM'),
            year : calendarMonth.firstDay.format('YYYY'),
            displayMonths : getDisplayMonths(),
            displayYears : getDisplayYears()
        };


        return finalResult;

    }

    function renderCalendar(calendarData) {

        var calendarContent = (calendarTemplate(calendarData));

        targetElement.append($(calendarContent));


        return targetElement;
    }

    function resetCalendar() {
        targetElement.children('div.tcalendar').remove();
        renderCalendar(formatCalendarMonth(generateCalendarMonth()));
    }

    function switchToPreviousMonth () {
        currentMoment.subtract(1, 'month');
        resetCalendar();
    }

    function switchToNextMonth() {
        currentMoment.add(1, 'month');
        resetCalendar();
    }

    function switchToMonth(month) {
//        console.log('Switching to month: ', parseInt(month));

        currentMoment.month(parseInt(month));

//        console.log('Current month: ', currentMoment.month());

        resetCalendar();
    }

    function switchToYear(year) {
        currentMoment.year(year);
        resetCalendar();
    }

    function resetPreviousInterval() {

        targetElement.find('table.tcalendar td').removeClass('selected');
        pendingInterval = null;

    }

    $.fn.tcalendar = function() {

        targetElement = $(this);

        renderCalendar(formatCalendarMonth(generateCalendarMonth()));

        $(this).on('click', 'div.previous-month', function(){
            switchToPreviousMonth();
        });

        $(this).on('click', 'div.next-month', function(){
            switchToNextMonth();
        });

        $(this).on('change', 'select.month-part', function(){
            switchToMonth($(this).find(":selected").val());
        });

        $(this).on('change', 'select.year-part', function(){
            switchToYear($(this).find(":selected").text());
        });

        $(this).on('click', 'table.tcalendar td a', function(event) {

            var dt = $(event.target).text();

            if (!pendingClickedMoment) {

                resetPreviousInterval();
                console.log('setting pending clicked moment');
                pendingClickedMoment = dt;

            } else {
                var clickedDates = [parseInt(pendingClickedMoment), parseInt(dt)];

                var from = _.min(clickedDates);

                var to = _.max(clickedDates);

                console.log('marking from ' + from + ' to ' + to);

                for (var cc = from; cc <= to; cc++){
                    $(this).parents('table').find('td.' + cc).addClass('selected');
                }

                pendingInterval = {
                    from : from,
                    to : to
                };

                pendingClickedMoment = undefined;

            }

        });

    }

})(jQuery, moment, _, Handlebars);



