const delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};


const g_state = {
    sigma: 1,
    is_turn: false
};

const C15 = {
    origin: { x: 390, y: 443.89 },
    unitX: 34,
    unitY: (310.5 - 443.89) / 0.16622595,
    step: 1/100,

    line_left_x:(x) => g_state.sigma * x ,
    line_left_y:(y) => (1/g_state.sigma) *y,

    line_right_x:(x) => g_state.sigma * x,
    line_right_y:(y) =>  (1/g_state.sigma) *y,


    fn_y_red: (x) => 1 / ((Math.sqrt(2 * Math.PI)) * g_state.sigma) * Math.exp(-(x * x) / (2 * g_state.sigma * g_state.sigma)),
    fn_x_red: (y) => Math.sqrt(Math.log(y * ((Math.sqrt(2 * Math.PI)) * g_state.sigma)) * ((-2) * g_state.sigma * g_state.sigma)),



    mapCoordinateToSVG: (p) => {
        return {
            x: C15.origin.x + p.x * C15.unitX,
            y: C15.origin.y + p.y * C15.unitY,
        };
        
    },
    mapCoordinateFromSVGToReal: (p) => {
        return {
            x: (p.x - C15.origin.x) / C15.unitX,
            y: (-p.y + C15.origin.y) / C15.unitY,
        };
    },

    render: () => {

        if(g_state.sigma != 1){
        
            showElement("#btn-reload-active",true)
        }
        

        let points = "";
        let points_1 = "";
        let count = 0;
        
        let leftSVG1= C15.mapCoordinateToSVG({x:C15.line_left_x(0.7),y:C15.line_left_y(0) });
        let leftSVG2= C15.mapCoordinateToSVG({x:C15.line_left_x(0.7),  y:C15.line_left_y(0.31) });

        let rightSVG1= C15.mapCoordinateToSVG({x:C15.line_right_x(-0.7),y:C15.line_right_y(0) });
        let rightSVG2= C15.mapCoordinateToSVG({x:C15.line_right_x(-0.7),  y:C15.line_right_y(0.31) });


        
        for (i = -10; i <= 10; i += C15.step) {
            let x = i;
            let y = C15.fn_y_red(x);
            let pSVG = C15.mapCoordinateToSVG({ x: x, y: y });

            points += pSVG.x + "," + pSVG.y + " ";

            if(pSVG.x > rightSVG1.x && pSVG.y <leftSVG2.y){
             points_1 += pSVG.x + " " + pSVG.y +" ";
             count++
            }
        
        }
        
        $("#red-line").attr("points", points);

       

        const scrollBar = $("#scrollPoint");
        scrollBar.attr("transform", `translate(${(g_state.sigma / 5) * 600 -120} 0)`);
    

        const pointTopLeft = $("#point-top-left")
        pointTopLeft.attr("cx",leftSVG1.x);
        pointTopLeft.attr("cy",leftSVG2.y);

        const pointTopRight = $("#point-top-right")
        pointTopRight.attr("cx",rightSVG1.x);
        pointTopRight.attr("cy",rightSVG2.y);

        const pointLeft = $("#point-right")
        pointLeft.attr("cx",leftSVG1.x);
        pointLeft.attr("cy",leftSVG1.y);

        const pointRight = $("#point-left")
        pointRight.attr("cx",rightSVG1.x);
        pointRight.attr("cy",rightSVG1.y);
        


        if(g_state.is_turn === true){
            
        $("#line_left").attr("x1",leftSVG1.x).attr("y1",leftSVG1.y).attr("x2",leftSVG2.x).attr("y2",leftSVG2.y)

        $("#line_right").attr("x1",rightSVG1.x).attr("y1",rightSVG1.y).attr("x2",rightSVG2.x).attr("y2",rightSVG2.y)
          $("#polygon").attr("points",rightSVG1.x+" "+rightSVG2.y+" "+ points_1 +leftSVG1.x+" "+leftSVG2.y+" "+ leftSVG1.x+" "+leftSVG1.y +" "+rightSVG1.x+" "+rightSVG1.y);
        }
        else{
            $("#polygon").attr("points",`${0}`);
            $("#line_right").attr("x1",0).attr("y1",0).attr("x2",0).attr("y2",0)
            $("#line_left").attr("x1",0).attr("y1",0).attr("x2",0).attr("y2",0)
        }
           

            let sigmas = $("#sm");
            
            sigmas.attr(`transform`,`translate( ${leftSVG1.x +40} ${leftSVG1.x - 150})`)
           
            const {sigma} = g_state ;
            document.getElementById("sm").textContent ="r = "+ parseFloat((Math.round(sigma * 100)/100).toFixed(1));
	              
    },
       

};

