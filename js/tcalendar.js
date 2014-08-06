

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
                    <td class="y-{{dYear}} m-{{dMonth}} d-{{date}}" data-year="{{dYear}}" data-month="{{dMonth}}">\
                        <a {{#unless inMonth}}class="not-in-month"{{/unless}} href="#">{{date}}</a>\
                    </td>\
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
                dMonth : dt.momentDate.month(),
                dYear : dt.momentDate.year(),
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

        if (pendingInterval){
            markIntervalOnCalendar(pendingInterval.from, pendingInterval.to);
        }

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

    function markDayOnCalendar(mmt) {
        targetElement.find('table.tcalendar td.y-' + mmt.year() + '.m-' + mmt.month() + '.d-' + mmt.date())
            .addClass('selected');
    }

    function markIntervalOnCalendar(mmt1, mmt2) {

        var currentDate = moment(mmt1);
        var finalDate = moment(mmt2).add(1, 'day');

        while (currentDate.isBefore(finalDate)){
            markDayOnCalendar(currentDate);
            currentDate.add(1, 'day');
        }

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

            var dt = parseInt($(event.target).text());
            var mth = parseInt($(event.target).parents('td').data('month'));
            var year = parseInt($(event.target).parents('td').data('year'));

            var thisMoment = moment([year, mth, dt]);

            if (!pendingClickedMoment) {

                resetPreviousInterval();
                console.log('setting pending clicked moment: ', thisMoment.toString());
                pendingClickedMoment = moment(thisMoment);

            } else {

                var from = undefined;
                var to = undefined;

                if (pendingClickedMoment.isBefore(thisMoment)) {
                    from = pendingClickedMoment;
                    to = thisMoment;
                } else {
                    from = thisMoment;
                    to = pendingClickedMoment;
                }

                console.log('marking from ' + from.toString() + ' to ' + to.toString());

                markIntervalOnCalendar(from, to);

                pendingInterval = {
                    from : from,
                    to : to
                };

                pendingClickedMoment = undefined;

            }

        });

    }

})(jQuery, moment, _, Handlebars);



