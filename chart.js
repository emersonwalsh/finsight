// TODO
// Add search capabilities
// Add toggle button to view last year vs. comprehensive data

'use strict'

var myApp = angular.module('myApp', []);

myApp.controller('finsightController', ['$scope', function($scope) {
        var myChart,
            input,
            config = {};
        
        // Variables
        $scope.desiredFunction = 'TIME_SERIES_DAILY';
        $scope.searchResults = [];
        $scope.showSearchResults = true;
        $scope.chartType = 'line'; // line or candlestick
        $scope.data = {};

        // Function
        $scope.startTour = startTour;
        $scope.updateSymbol = updateSymbol;
        $scope.updateTime = updateTime;
        $scope.searchName = searchName;
        $scope.searchFromResults = searchFromResults;

        /**
         * Start the product tour
         */
        function startTour() {
            introJs().setOptions({
                "exitOnOverlayClick": true,
                "showProgress": false,
                "showBullets": true,
                "showStepNumbers": false,
                "scrollPadding": 0,
                "scrollToElement": false
            }).start();

            // introJs().addHints();

            // Save to localStorage
            localStorage.setItem('tour', true)

        }

        /**
         * Set initial stock variables.
         */
        function getData() {
            var stockSymbol,
                previusSearch;
        
            // get stock symbol from local storage if it exists
            previusSearch = localStorage.getItem('symbol');
            $scope.userSymbol = previusSearch || 'FB';
        
            searchSymbol();
        }

        /**
         * Parse through stock data using response from Aplha Vantage API.
         */
        function formatData() {
            var returnObj = {},
                dataSet,
                timeSeries = [],
                values = [],
                volume = [],
                timeKey = 'Time Series (Daily)',
                time;

            if ($scope.desiredFunction === 'TIME_SERIES_WEEKLY') {
                timeKey = 'Weekly Time Series';
            } else if ($scope.desiredFunction === 'TIME_SERIES_MONTHLY') {
                timeKey = 'Monthly Time Series';
            }
            
            for (time in $scope.data[timeKey]) {
                if ($scope.data[timeKey].hasOwnProperty(time)) {
                    timeSeries.push(time);
                    volume.push($scope.data[timeKey][time]['5. volume']);
                    dataSet = [];
                    if ($scope.chartType === 'line') {
                        values.push($scope.data[timeKey][time]['4. close']);
                    } else {
                        dataSet.push($scope.data[timeKey][time]['1. open']);
                        dataSet.push($scope.data[timeKey][time]['4. close']);
                        dataSet.push($scope.data[timeKey][time]['3. low']);
                        dataSet.push($scope.data[timeKey][time]['2. high']);
                        values.push(dataSet)
                    }
                }
            }
        
            config.timeSeries = timeSeries.reverse();
            config.values = values.reverse();
            config.volume = volume.reverse();
            if ($scope.data.hasOwnProperty('Meta Data')) {
                config.lastRefresh = $scope.data['Meta Data']['3. Last Refreshed'];
                config.stockSymbol = $scope.data['Meta Data']['2. Symbol'];
            }
            config.MA5 = calculateMA(5);
        
            paint();
        }
        
        /**
         * Paint the candle stick visualization.
         */
        function paint() {
            // TODO 
            // max and min lines
            var option = {
                title: {
                    text: config.stockSymbol.toUpperCase(),
                    subtext: 'Last Refreshed on ' + config.lastRefresh,
                    left: 'center',
                    top: '85px',
                    textStyle: { color: '#fff' }
                },
                legend: {
                    left: '5%',
                    top: '60px',
                    data: [{ 
                        name: 'K',
                     }, {
                         name: 'MA5'
                    }, {
                         name: 'Volume'
                     }],
                    textStyle: { color: '#fff' },
                    selected: {
                        'K': true,
                        'MA5': false,
                        'Volume': true
                    }
                },
                toolbox: {
                    right: '5%',
                    top: '60px',
                    feature: {
                        myTool1: {
                            show: true,
                            title: 'Line',
                            icon: 'path://M76.2286606,33.3063164c-3.2611847,0-5.9146805,2.6534958-5.9146805,5.915493  c0,0.6927032,0.1259232,1.3550034,0.3457642,1.9732819L58.632,51.3508034  c-0.848156-0.4704018-1.8222809-0.7402534-2.8590088-0.7402534c-1.1175003,0-2.1597519,0.3170967-3.0521851,0.8576736  l-6.8813782-5.3488617c0.1744423-0.5572128,0.2687798-1.149437,0.2687798-1.7633667  c0-3.2619972-2.6534958-5.915493-5.9146767-5.915493c-3.2611771,0-5.9146729,2.6534958-5.9146729,5.915493  c0,0.8643341,0.1908722,1.6834145,0.5255775,2.4242859l-8.6094761,8.6088638  c-0.7408695-0.3347092-1.5600548-0.525631-2.4244366-0.525631c-3.261179,0-5.9146748,2.6534958-5.9146748,5.915493  c0,3.2611771,2.6534958,5.9146729,5.9146748,5.9146729s5.9146748-2.6534958,5.9146748-5.9146729  c0-0.8646393-0.1908741-1.6840286-0.5256329-2.4250526l8.6095314-8.6089134  c0.7408676,0.3347054,1.5600548,0.525631,2.4244347,0.525631c1.1170883,0,2.1590385-0.3170471,3.0513153-0.8575249  l6.8813782,5.3488121c-0.1743889,0.5571632-0.2687263,1.1493874-0.2687263,1.7632637  c0,3.2611809,2.6534958,5.9146767,5.915493,5.9146767s5.915493-2.6534958,5.915493-5.9146767  c0-0.6931114-0.1260719-1.3558197-0.3461723-1.9743576l12.0271339-10.155098  c0.8482056,0.4706573,1.8223801,0.7407188,2.8592148,0.7407188c3.2619934,0,5.9154892-2.6534958,5.9154892-5.9146767  C82.1441498,35.9598122,79.490654,33.3063164,76.2286606,33.3063164z M23.7705231,62.5005035  c-0.9491978,0-1.7214966-0.7723007-1.7214966-1.7214966c0-0.9500198,0.7722988-1.7223167,1.7214966-1.7223167  s1.7214966,0.7722969,1.7214966,1.7223167C25.4920197,61.7282028,24.7197208,62.5005035,23.7705231,62.5005035z   M38.4720345,44.3559952c0-0.950016,0.7723007-1.7223129,1.7214966-1.7223129c0.9491997,0,1.7214966,0.7722969,1.7214966,1.7223129  c0,0.9491997-0.7722969,1.7214966-1.7214966,1.7214966C39.2443352,46.0774918,38.4720345,45.3051949,38.4720345,44.3559952z   M55.7729912,58.2467194c-0.950016,0-1.7223167-0.7722969-1.7223167-1.7214966c0-0.9491959,0.7723007-1.7214966,1.7223167-1.7214966  s1.7223167,0.7723007,1.7223167,1.7214966C57.4953079,57.4744225,56.7230072,58.2467194,55.7729912,58.2467194z   M76.2286606,40.943306c-0.9492035,0-1.7214966-0.7722969-1.7214966-1.7214966c0-0.950016,0.7722931-1.7223129,1.7214966-1.7223129  c0.9500122,0,1.7223129,0.7722969,1.7223129,1.7223129C77.9509735,40.1710091,77.1786728,40.943306,76.2286606,40.943306z',
                            onclick: function (){
                                if ($scope.chartType === 'line') {
                                    return;
                                }
                                $scope.chartType = 'line';
                                formatData();
                            }
                        },
                        myTool2: {
                            show: true,
                            title: 'Candle Stick',
                            icon: 'path://M50,87.36914a1.24991,1.24991,0,0,0,1.25-1.25V75.13965h7.42432a1.24991,1.24991,0,0,0,1.25-1.25V25.541a1.24991,1.24991,0,0,0-1.25-1.25H51.25V13.88086a1.25,1.25,0,0,0-2.5,0V24.291H41.32568a1.24991,1.24991,0,0,0-1.25,1.25V73.88965a1.24991,1.24991,0,0,0,1.25,1.25H48.75V86.11914A1.24991,1.24991,0,0,0,50,87.36914ZM42.57568,26.791H57.42432V72.63965H42.57568Z',
                            onclick: function (){
                                if ($scope.chartType === 'candlestick') {
                                    return;
                                }
                                $scope.chartType = 'candlestick';
                                formatData();
                            }
                        }
                    }
                },
                xAxis: [
                    {
                        type: 'category',
                        data: config.timeSeries,
                        axisLine: { lineStyle: { color: '#fff' } },
                        axisLabel: {
                            formatter: function (value) {
                                return echarts.format.formatTime('MM-dd', value);
                            }
                        }
                    },
                    {
                        type: 'category',
                        data: config.timeSeries,
                        gridIndex: 1,
                        axisLine: { lineStyle: { color: '#fff' } },
                        splitLine: {show: false},
                        axisLabel: {show: false},
                        axisTick: {show: false}
                    }
                ],
                yAxis: [
                    {
                        scale: true,
                        axisLine: { lineStyle: { color: '#fff' } },
                        splitLine: { show: false }
                    },
                    {
                        scale: true,
                        gridIndex: 1,
                        axisLabel: {show: false},
                        axisLine: {show: false},
                        axisTick: {show: false},
                        splitLine: {show: false}
                    }
                ],
                grid: [
                    {
                        left: '10%',
                        right: '10%',
                        top: '145px',
                        height: '60%'
                    },
                    {
                        left: '10%',
                        right: '10%',
                        bottom: '10%',
                        top: '81%'
                    }
                ],
                backgroundColor: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                        offset: 0,
                        color: '#131315'
                    },
                    {
                        offset: 1,
                        color: '#212033'
                    }
                ], false),
                tooltip: {
                    trigger: 'axis',
                    formatter: function (param) {
                        var dateString = '',
                            averageString = '',
                            volumeString = '',
                            dateMarker,
                            dateValue,
                            openValue,
                            closedValue,
                            lowValue,
                            highValue,
                            averageMarker,
                            averageValue,
                            volumeMarker,
                            volumeValue,
                            i;
        
                        for(i = 0; i < param.length; i++) {
                            if (param[i].seriesName === 'Volume') {
                                volumeMarker = param[i].marker;
                                volumeValue = Number(param[i].value);
                                volumeString += volumeMarker +' Volume: ' + volumeValue.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  }) + '<br>';
                            } else if (param[i].seriesName === 'K') {
                                dateMarker = param[i].marker;
                                if ($scope.chartType === 'line') {
                                    dateValue = param[i].axisValue;
                                    closedValue = Number(param[i].data);
                                    dateString += dateMarker + dateValue + '<br>' 
                                        + '  Closed: <b>' + closedValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) + '</b><br>';
                                } else {
                                    if (typeof param[i].value === 'object') {
                                        dateValue = param[i].axisValue;
                                    } else {
                                        dateValue = param[i].value;
            
                                    }
                                    openValue = Number(param[i].data[1]);
                                    closedValue = Number(param[i].data[2]);
                                    lowValue = Number(param[i].data[3]);
                                    highValue = Number(param[i].data[4]);
                                    dateString += dateMarker + dateValue + '<br>' 
                                        + '  Open: ' + openValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                          }) + '<br>' 
                                        + '  Closed: ' + closedValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                          }) + '<br>' 
                                        + '  Low: ' + lowValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                          }) + '<br>' 
                                        + '  High: ' + highValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                          }) + '<br>';
                                }       
                            } else if (param[i].seriesName === 'MA5') {
                                averageMarker = param[i].marker;
                                averageValue = Number(param[i].value);
                                averageString +=  averageMarker + ' MA5: ' + averageValue.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  }) + '<br>';
                            }
                        
                        }
        
                        return dateString + averageString + volumeString;
                    }
                },
                axisPointer: {
                    link: [{
                        xAxisIndex: [0, 1]
                    }],
                    lineStyle: {
                        color: '#376df4',
                        width: 2,
                        opacity: 0.4
                    }
                },
                dataZoom: [{
                    textStyle: {
                        color: '#fff'
                    },
                    xAxisIndex: [0, 1],
                    handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                    handleSize: '80%',
                    dataBackground: {
                        areaStyle: {
                            color: '#fff'
                        },
                        lineStyle: {
                            opacity: 0.8,
                            color: '#fff'
                        }
                    },
                    start: 60,
                    end: 100,
                    handleStyle: {
                        color: '#fff',
                        shadowBlur: 3,
                        shadowColor: 'rgba(0, 0, 0, 0.6)',
                        shadowOffsetX: 2,
                        shadowOffsetY: 2
                    },
                    bottom: '3%',
                    height: '4%'
                }, {
                    type: 'inside',
                    xAxisIndex: [0, 1]
                }],
                series: [
                    {
                        name: 'K',
                        type: $scope.chartType,
                        data: config.values,
                        itemStyle: {
                            normal: {
                                color: '#0CF49B',
                                color0: '#FD1050',
                                borderColor: '#0CF49B',
                                borderColor0: '#FD1050'
                            }
                        },
                        axisPointer: {
                            type: 'cross',
                        }
                    },
                    {
                        name: 'MA5',
                        type: 'line',
                        data: config.MA5,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: {
                            normal: {
                                width: 1.5,
                                color: '#fff',
                                type: 'dashed'
                            }
                        }
                    },
                    {
                        name: 'Volume',
                        type: 'bar',
                        xAxisIndex: 1,
                        yAxisIndex: 1,
                        itemStyle: {
                            normal: {
                                color: '#51A7F9'
                            }
                        },
                        data: config.volume,
                        axisPointer: {
                            type: 'shadow'
                        }
                    }
                ]
            };

            // Line specific styling
            if ($scope.chartType === 'line') {
                option.series[0].smooth = true;
                option.series[0].showSymbol = false;
                option.series[0].lineStyle = { // use areaaStyle also?
                    normal: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: '#0CF49B'
                            },
                            {
                                offset: 1,
                                color: '#FD1050'
                            }
                        ], false),
                    }
                };
            }


            myChart.setOption(option);
            
            // handle click event
            myChart.on('click', function (params) {
                var url, searchTerm, date;
                if (params.data.length > 0) {
                    date = params.name;
                    url = 'https://www.google.com/search?';
                    url += 'q=' + config.stockSymbol + '+stock+' + date + '&';
                    url += 'tbm=nws' 
                    window.open(url, '_blank');
        
                }
            });
        }

        /**
         * Calculate the moving average from the stock data.
         * @param {number} dayCount number of days for the moving average
         * @return {number} The result of the moving average
         */
        function calculateMA(dayCount) {
            var result = [];
            for (var i = 0, len = config.values.length; i < len; i++) {
                if (i < dayCount) {
                    result.push('-');
                    continue;
                }
                var sum = 0;
                for (var j = 0; j < dayCount; j++) {
                    if ($scope.chartType === 'line') {
                        sum += Number(config.values[i - j]);
                    } else {
                        sum += Number(config.values[i - j][1]);
                    }
                }
                result.push((sum / dayCount).toFixed(2));
            }
            return result;
        }
        
        /**
         * Update the stock symbol based on the user's input.
         */
        function updateSymbol() {
            if (!$scope.userSymbol) {
                return;
            }

            // Save to localStorage
            localStorage.setItem('symbol', $scope.userSymbol)

            searchSymbol();        
        }

        /**
         * Search for stock data using the Alpha Vantage API.
         */
        function searchSymbol() {
            var apiKey = '449P5UNKD4LX1UO9',
            outputSize = 'compact', // full or compact
            url = '';

            url += 'https://www.alphavantage.co/query?function=' + $scope.desiredFunction;
            url += '&symbol=' + $scope.userSymbol; 

            // TODO if daily by default set output size to 'full'
            if ($scope.desiredFunction === 'TIME_SERIES_DAILY') {
                url += '&outputsize=' + outputSize; 
            }
            url += '&apikey=' + apiKey;

            // $.getJSON(url, function(data) {
            //     if (data.hasOwnProperty('Error Message') || data.hasOwnProperty('Note')) {
            //         return;
            //     }
            //     // TODO only update $scope.desiredFunction if data comes back succesfully
            //     formatData(data)
            // });

            $.ajax({
                type: 'GET',
                url: url,
                async: false,
                contentType: "application/json",
                dataType: 'json',
                success: function (data) {
                    if (data.hasOwnProperty('Error Message') || data.hasOwnProperty('Note')) {
                        return;
                    }
                    // TODO only update $scope.desiredFunction if data comes back succesfully
                    $scope.data = data;
                    formatData()
                },
                error: function (e) {
                    alert("error");
                }
            });
        }

        /**
         * Update chart with new symbol selected from search results
         * @param {object} result selected search result
         */
        function searchFromResults(result) {
            if (result.hasOwnProperty('1. symbol')) {
                $scope.userSymbol = result['1. symbol']
                searchSymbol();
            }
        }

        /**
         * Update the time interval to show.
         * @param {string} interval The time interval/range specified by the user
         */
        function updateTime(interval) {
            switch (interval) {
                case 'Daily':
                    $scope.desiredFunction = 'TIME_SERIES_DAILY';
                    break;
                case 'Weekly':
                    $scope.desiredFunction = 'TIME_SERIES_WEEKLY';
                    break;
                case 'Monthly':
                    $scope.desiredFunction = 'TIME_SERIES_MONTHLY';
                    break;
                default:
                    $scope.desiredFunction = 'TIME_SERIES_DAILY';
            }
            searchSymbol();
        }

        /**
         * Search for valid stocks
         */
        function searchName() {
            // TODO add 0.25 sec timeout before hitting url

            var apiKey = '449P5UNKD4LX1UO9',
                url = '';

            $scope.searchResults = [];

            url += 'https://www.alphavantage.co/query?function=SYMBOL_SEARCH';
            url += '&keywords=' + $scope.userSymbol; 

            url += '&apikey=' + apiKey;

            // $.getJSON(url, function(data) {
            //     var i;
            //     if (data.hasOwnProperty('bestMatches')) {
            //         $scope.searchResults = data.bestMatches;
            //         console.log($scope.searchResults);
            //     }
            // });

            $.ajax({
                type: 'GET',
                url: url,
                async: false,
                contentType: "application/json",
                dataType: 'json',
                success: function (data) {
                    var i;
                    if (data.hasOwnProperty('bestMatches')) {
                        $scope.searchResults = data.bestMatches;
                        console.log($scope.searchResults);
                    }
                },
                error: function (e) {
                    alert("error");
                }
            });
        }
        
        /**
         * Initial Function
         */
        function initialize() {
            $(document).ready(function(){
                $('.searchBar').focus(function(){
                    $('.search-results').fadeIn(250);
                    $('.search-results-arrow').fadeIn(250);
                }).focusout(function(){
                    $('.search-results').fadeOut(250);
                    $('.search-results-arrow').fadeOut(250);
                });
             });

            var productTour = localStorage.getItem('tour');

            // Start product tour if first time for user
            if (!productTour) {
                startTour();
            }
            myChart = echarts.init(document.getElementById('chart'));
            getData();
        }

        // Listeners
        window.addEventListener('resize', function() {
            if (myChart) {
                myChart.resize();
            }
        });

        input = document.getElementById("user-input");
        input.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.getElementById("symbol-button").click();
        }
        });
    
        initialize();
}]);