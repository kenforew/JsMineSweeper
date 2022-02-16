class Int2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Int3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(pos) {
        return new Int3(
            this.x + pos.x,
            this.y + pos.y,
            this.z + pos.z
        );
    }
  
    mlt(a) {
        return new Int3(
            this.x * a,
            this.y * a,
            this.z * a
        );
    }
}

class Pos3D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    rotate(rotZ, rotY) {
        var newX, newY, newZ;
        newX = this.x * Math.cos(rotZ) - this.y * Math.sin(rotZ);
        newY = this.x * Math.sin(rotZ) + this.y * Math.cos(rotZ);
        this.x = newX;
        this.y = newY;

        rotY = -rotY;

        newZ = this.z * Math.cos(rotY) - this.x * Math.sin(rotY);
        newX = this.z * Math.sin(rotY) + this.x * Math.cos(rotY);
        this.z = newZ;
        this.x = newX;
    }
}

class Object3D extends Pos3D {
    constructor(x, y, z, index) {
        super(x, y, z);
        this.index = index;
    }
}

class Cell  extends Object3D {
    constructor(x, y, z, index) {
        super(x, y, z, index);

        this.neighbors = 0;
        this.color = new Int3(0, 0, 0);
      
        this.danger = false;
        this.demined = false;
        this.flag = false;
        
        this.label = "";
    }
}

class Controller extends Object3D {
    constructor(x, y, z, index, color) {
        super(x, y, z, index);
        this.color = color;//
    }
}

class GameArea {
    constructor() {
        this.canvas = new Int2(400, 400);
    }
}

class Mouse {
    constructor() {
        this.downPos = new Int2(0, 0);
        this.escapePos = new Int2(0, 0);
        this.updatePos = new Int2(0, 0);
        this.upPos = new Int2(0, 0);

        this.is_down = false;
        this.is_longPress = false;
        this.is_init = false;
        this.is_leftClick = false;
    }
}

class GameManager {
    constructor() {
        this.cursor = new Int3(2, 2, 2);
        this.size = new Int3(6, 6, 6)
        this.volume = 6 * 6 * 6;
        this.mines = 10;
        this.rotZ = 0;
        this.rotY = 0;

        this.lightSource = new Int3(400, 0, 0);

        this.cellSize = 10;

        this.gameclear = false;
        this.gameover = false;

        this.startTime = 0;
        this.endTime = 0;
    }
}

var gameArea = new GameArea();
var mouse = new Mouse();
var gameManager = new GameManager();

var canvas, ctx, fixedPlane, date = new Date().getTime();

(() => {
    canvas = document.getElementsByTagName("canvas")[0];
    ctx = canvas.getContext("2d");
    canvas.width = gameArea.canvas.x;
    canvas.height = gameArea.canvas.y;

    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, gameArea.canvas.x, gameArea.canvas.y);
    
    fixedPlane = "x";

})();


cellIndexList = [];

//cellIndexListInitialize();

neighborList = [];

for(var i = -1; i < 2; ++i) {
    for(var j = -1; j < 2; ++j) {
        for(var k = -1; k < 2; ++k) {
            neighborList.push(new Int3(i, j, k));
        }
    }
}

var cellList = [];

//cellListInitialize();

var controllerList = [];

gameInitialize();

function cellIndexListInitialize() {
    cellIndexList = [];
    for(var i = 0; i < gameManager.size.x; ++i) {
        for(var j = 0; j < gameManager.size.y; ++j) {
            for(var k = 0; k < gameManager.size.z; ++k) {
                cellIndexList.push(new Int3(i, j, k));
            }
        }
}
   
}

function controllerListInitialize() {
    controllerList = [];
    for(var i = 0; i < 2; ++i) {
        var sgn = 2 * i - 1;
        controllerList.push(new Controller(
            50 * sgn, 0, 0, new Int3(sgn, 0, 0), [200 * i, 100, 100]
        ));
        controllerList.push(new Controller(
            0, 50 * sgn, 0, new Int3(0, sgn, 0), [100, 200 * i, 100]
        ));
        controllerList.push(new Controller(
            0, 0, 50 * sgn, new Int3(0, 0, sgn), [100, 100, 200 * i]
        ));
    }
}

function cellListInitialize() {
    cellList = Array(gameManager.size.x);
    for(var i = 0; i < gameManager.size.x; ++i) {
        cellList[i] = Array(gameManager.size.y);
        for(var j = 0; j < gameManager.size.y; ++j) {
            cellList[i][j] = Array(gameManager.size.z);
            for(var k = 0; k < gameManager.size.z; ++k) {
                cellList[i][j][k] = new Cell(
                    25 * (i - (gameManager.size.x - 1) / 2),
                    25 * (j - (gameManager.size.y - 1) / 2),
                    25 * (k - (gameManager.size.z - 1) / 2),
                    new Int3(i, j, k)
                )
            }
        }
    }

    cellIndexListInitialize();
    dangerInitialize();

    for(var i = 0; i < cellIndexList.length; ++i) {
        var p = cellIndexList[i];

        var neighbors = count(p)
        cellList[p.x][p.y][p.z].neighbors = neighbors;
        cellList[p.x][p.y][p.z].color = cellColor(neighbors);
        cellList[p.x][p.y][p.z].label = (cellList[p.x][p.y][p.z].danger)
            ? "b"
            : neighbors;
    }
}

//function timeCounter() {
//    while(true) {
//        while(mouse.is_init) {
//            setInterval(() => {
//                gameManager.time++;
//            }, 1000); 
//        }
//    }
//}

function flagCounter() {
    var x = 0;
    for(var i = 0; i < cellIndexList.length; ++i) {
        var p = cellIndexList[i];
        if(cellList[p.x][p.y][p.z].flag
        && !cellList[p.x][p.y][p.z].demined) {
            x++;
        }
    }
    return x;
}

function modeChange(m) {
    switch(m) {
        case "easy":
            gameManager.size = new Int3(6, 6, 6);
            gameManager.volume = 6 * 6 * 6;
            gameManager.mines = 10;
            break;
        case "normal":
            gameManager.size = new Int3(8, 8, 8);
            gameManager.volume = 8 * 8 * 8;
            gameManager.mines = 40;
            break;
        case "hard":
            gameManager.size = new Int3(10, 10, 10);
            gameManager.volume = 10 * 10 * 10;
            gameManager.mines = 99;
            break;
        default:
            break;
    }

    gameInitialize();
}

function cellColor(x) {
    var R = 0; G = 0; B = 0;

    switch(x % 3) {
        case 0:
            R = 0x11;
            break;
        case 1:
            R = 0x55;
            break;
        case 2:
            R = 0x99;
            break;
        default:
            break;
    }

    switch(Math.floor(x / 2) % 3) {
        case 0:
            G = 0x44;
            break;
        case 1:
            G = 0x88;
            break;
        case 2:
            G = 0xcc;
            break;
        default:
            break;
    }
    switch(Math.floor(x / 3) % 3) {
        case 0:
            B = 0x77;
            break;
        case 1:
            B = 0xbb;
            break;
        case 2:
            B = 0xff;
            break;
        default:
            break;
    }

    return [R, G, B];
}

function gameClearJudge() {
    var counter = 0;
    for(var i = 0; i < cellIndexList.length; ++i) {
        var p = cellIndexList[i];
        if(cellList[p.x][p.y][p.z].demined) {
            counter++;
        }
    }
    
    if(counter == (gameManager.volume - gameManager.mines)) {
        gameManager.gameclear = true;
        gameManager.gameover = true;
        mouse.is_init = false;
    }
    
    if(gameManager.gameclear) {
        console.log("game clear");
    }
}

function gameInitialize() {
    gameManager.gameover = false;
    gameManager.gameclear = false;
    gameManager.time = 0;
    mouse.is_init = false;

    mouse.downPos = new Int2(0, 0);
    mouse.updatePos = new Int2(0, 0);
    mouse.upPos = new Int2(0, 0);

    gameManager.cursor = new Int3(3, 3, 3);

    controllerListInitialize();

    cellListInitialize();

    gameDisplay();
}

function dangerInitialize() {
    mineIndex = [];
    var newIntFlag = true;

    while(mineIndex.length < gameManager.mines) {
        var rand = Math.floor(Math.random() * gameManager.volume);

        newIntFlag = true;
        for(var i = 0; i < mineIndex.length; ++i) {
            if(mineIndex[i] == rand) {
                newIntFlag = false;
                break;
            }
        }
        if(newIntFlag) {
            mineIndex.push(rand);
        }
    }
    
    for(var i = 0; i < gameManager.mines; ++i) {
        var p = cellIndexList[mineIndex[i]];
        cellList[p.x][p.y][p.z].danger = true;
        console.log("danger at :"+p.x+" "+p.y+" "+p.z);
    }
}

function is_inBoard(p) {
    if(p.x >= 0 && p.x < gameManager.size.x
    && p.y >= 0 && p.y < gameManager.size.y
    && p.z >= 0 && p.z < gameManager.size.z) {
        return true;
    } else {
        return false;
    }
}

function safechain(p) {
    for(var i = 0; i < neighborList.length; ++i) {
        safechain_internal(
            p.add(neighborList[i])
        );
    }
}

function safechain_internal(p) {
    if(is_inBoard(p)
    && !cellList[p.x][p.y][p.z].demined) {
        cellList[p.x][p.y][p.z].demined = true;
        if(is_safe(p)) {
            safechain(p);
        }
    }
    return;
}

function is_safe(p) {
    var ans = true;

    for(var i = 0; i < neighborList.length; ++i) {
        ans = ans && is_safe_internal(
            p.add(neighborList[i])
        );
    }

    return ans;
}

function is_safe_internal(p) {
    if(!is_inBoard(p)) {
        return true;
    } else {
        if(cellList[p.x][p.y][p.z].danger) {
            return false;
        } else {
            return true;
        }
    }
}

function count(p) {
    var sum = 0;
    
    for(var i = 0; i < neighborList.length; ++i) {
        sum += count_internal(
            p.add(neighborList[i])
        );
    }
    
    return sum;
}

function count_internal(p) {
    if(!is_inBoard(p)) {
        return 0;
    } else {
        return cellList[p.x][p.y][p.z].danger ? 1 : 0;
    }
}

function sortList(list) {
    for(var i = 0; i < list.length; ++i) {
        for(var j = i + 1; j < list.length; ++j) {
            if(list[i].x > list[j].x) {
                var t = list[i];
                list[i] = list[j];
                list[j] = t;
            }
        }
    }
    return list;
}

function gameDisplay() {
    //console.log("gamedisplay called.");
    
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    

    //cell
    var cellList_line = [];
    for(var i = 0; i < cellIndexList.length; ++i) {
        var p = cellIndexList[i];
        cellList_line.push(cellList[p.x][p.y][p.z]);
    }
    var sortCellList = sortList(cellList_line);
    
    for(var i = 0; i < gameManager.volume; ++i) {
        var object = sortCellList[i];

        var fy, fz, fr, oy, oz, size;
        fy = object.y;
        fz = object.z;
        fr = gameManager.lightSource.x / (gameManager.lightSource.x - object.x);
        oy = gameArea.canvas.x / 2;
        oz = gameArea.canvas.y * 3 / 8;
        size = gameManager.cellSize;

        var ix, iy, iz, onCursor;
        ix = object.index.x;
        iy = object.index.y;
        iz = object.index.z;
        onCursor = (gameManager.cursor.x == ix)
                && (gameManager.cursor.y == iy)
                && (gameManager.cursor.z == iz);
        

        var cellColor = (() => {
            if(onCursor) {
                return [254, 254, 254];
            } else {
                if(!object.demined) {
                    return [
                        Math.floor(fr * 10 * 10 + 44),
                        Math.floor(fr * 10 * 10),
                        Math.floor(fr * 10 * 10 + 22)
                    ];
                } else {
                    return object.color;
                }
            }
        })();
        
        var cellText = (() => {
            //console.log("object.demined : "+object.demined);
            //console.log("object.flag : "+object.flag);
            if(!object.demined) {
                if(object.flag) {
                    return "f";
                } else {
                    return "";
                }
            } else {
                return object.label;
            }
        })();

        if(!(object.demined && (object.neighbors == 0))
        || onCursor) {
            ctx.fillStyle = "rgb("
                + cellColor[0] + ","
                + cellColor[1] + ","
                + cellColor[2] + ")";
            
            ctx.beginPath();
            ctx.arc(
                fy * fr + oy, fz * fr + oz, size * fr,
                0, 2 * Math.PI, false
            );
            ctx.fill();
            //ctx.stroke();

            //console.log("draw cell");
            
            if(cellText != 0) {
                //puttext celltext
                ctx.strokeStyle="rgb(1,1,1)";
                ctx.strokeText(cellText, fy * fr + oy - 2, fz * fr + oz + 2);
            }
            if(gameManager.gameclear) {
                //puttext gameclear
                ctx.strokeStyle="rgb(254,254,254)";
                ctx.strokeText("GAME CLEAR", gameArea.canvas.x / 2, gameArea.canvas.y / 2);
            } else if(gameManager.gameover) {
                //puttext gameover
                ctx.strokeStyle="rgb(254,254,254)";
                ctx.strokeText("GAME OVER", gameArea.canvas.x / 2, gameArea.canvas.y / 2);

            }
        }
    }

    //controller
    var sortControllerList = sortList(controllerList);

    for(var i = 0; i < 6; ++i) {
        var object = sortControllerList[i];
        var cy, cz, cr, oy, oz, size;
        cy = object.y;
        cz = object.z;
        cr = gameManager.lightSource.x / (gameManager.lightSource.x - object.x);
        oy = gameArea.canvas.x / 2;
        oz = gameArea.canvas.y * 13 / 16;
        size = gameManager.cellSize;

        ctx.fillStyle = "rgb("
            + object.color[0] + ","
            + object.color[1] + ","
            + object.color[2] + ")";
        ctx.beginPath();
        ctx.arc(
            cy * cr + oy, cz * cr + oz, size * cr,
            0, 2 * Math.PI, false
        );
        ctx.fill();

        var label = (() => {
            if(object.color[0] != 100) {
                return "x";
            } else if(object.color[1] != 100) {
                return "y";
            } else if(object.color[2] != 100) {
                return "z";
            } else {
                return "";
            }
        })();

        ctx.strokeStyle = "rgb(254,254,254)";
        ctx.strokeText(label, cy * cr * 1.4 + oy - 2.5, cz * cr * 1.4 + oz + 2.5);

        //console.log("controller draw");

        if(i == 2) {
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.beginPath();
            ctx.arc(oy, oz, 2 * size, 0, 2 * Math.PI, false);
            ctx.fill();
        }
    }

    if(!gameManager.gameover) {
        gameManager.endTime = new Date().getTime();
    }
    ctx.strokeStyle = "rgb(254,254,254)";
    ctx.strokeText("Flag : " + flagCounter(), 20, gameArea.canvas.y - 40);
    ctx.strokeText("Time : " + Math.floor((gameManager.endTime - gameManager.startTime) / 1000),
                    20, gameArea.canvas.y - 20);

    requestAnimationFrame(gameDisplay);
}

canvas.addEventListener("mousedown", e => {
    console.log("left click down");
    
    mouse.is_down = true;
    mouse.is_longPress = false;
    mouse.is_leftClick = true;

    var rect = e.target.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    mouse.downPos = new Int2(x, y);
    mouse.escapePos = new Int2(x, y);
    mouse.updatePos = new Int2(x, y);
});

canvas.addEventListener("mousemove", e => {
    var rect = e.target.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;

    if(!mouse.is_longPress
    && Math.sqrt(
        (x - mouse.downPos.x) * (x - mouse.downPos.x)
        + (y - mouse.downPos.y) * (y - mouse.downPos.y)
    ) > 10) {
        mouse.is_longPress = true;
    }

    if(mouse.is_down) {
        mouse.updatePos = new Int2(x, y);
        gameManager.rotZ = (mouse.updatePos.x - mouse.escapePos.x) / 30;
        gameManager.rotY = (mouse.updatePos.y - mouse.escapePos.y) / 30;
        
        for(var i = 0; i < cellIndexList.length; ++i) {
            var p = cellIndexList[i];
            cellList[p.x][p.y][p.z].rotate(gameManager.rotZ, gameManager.rotY);
        }

        for(var i = 0; i < 6; ++i) {
            controllerList[i].rotate(gameManager.rotZ, gameManager.rotY);
        }

        mouse.escapePos = new Int2(x, y);
        
        
    }
});


canvas.addEventListener("mouseup", e => {
    //console.log("left click up");
    mouse.is_down = false;
    if(mouse.is_longPress) {
        mouse.is_longPress = false;
        return;
    }

    var rect = e.target.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    var p = ctx.getImageData(x, y, 1, 1).data;

    if(p[0] == 255
    && p[1] == 255
    && p[2] == 255) {
        //console.log("click white");

        mouse.is_longPress = false;
        var p = gameManager.cursor;
        var object = cellList[p.x][p.y][p.z];
        if(!object.demined && !object.flag) {
            cellList[p.x][p.y][p.z].demined = true;
            if(object.danger) {
                gameManager.gameover = true;
                mouse.is_init = false;//initialize
                gameManager.endTime = new Date().getTime();
            } else if(is_safe(p)){
                safechain(p);
            }

            if(!gameManager.gameover) {
                if(!mouse.is_init) {
                    gameManager.startTime = new Date().getTime();
                    mouse.is_init = true;
                }
            }
        }
    }

    if(p[0] == 0
    && p[1] == 100
    && p[2] == 100) {
        gameManager.cursor.x--;
        if(gameManager.cursor.x < 0) {
            gameManager.cursor.x += gameManager.size.x;
        }
    }
    if(p[0] == 200
    && p[1] == 100
    && p[2] == 100) {
        gameManager.cursor.x++;
        if(gameManager.cursor.x >= gameManager.size.x) {
            gameManager.cursor.x -= gameManager.size.x;
        }
    }

    if(p[0] == 100
    && p[1] == 0
    && p[2] == 100) {
        gameManager.cursor.y--;
        if(gameManager.cursor.y < 0) {
            gameManager.cursor.y += gameManager.size.y;
        }
    }
    if(p[0] == 100
    && p[1] == 200
    && p[2] == 100) {
        gameManager.cursor.y++;
        if(gameManager.cursor.y >= gameManager.size.y) {
            gameManager.cursor.y -= gameManager.size.y;
        }
    }

    if(p[0] == 100
    && p[1] == 100
    && p[2] == 0) {
        gameManager.cursor.z--;
        if(gameManager.cursor.z < 0) {
            gameManager.cursor.z += gameManager.size.z;
        }
    }
    if(p[0] == 100
    && p[1] == 100
    && p[2] == 200) {
        gameManager.cursor.z++;
        if(gameManager.cursor.z >= gameManager.size.z) {
            gameManager.cursor.z -= gameManager.size.z;
        }
    }

    mouse.is_longPress = false;
});

canvas.addEventListener("contextmenu", e => {
    console.log("right click");
    //if(mouse.is_longPress) {
    //    mouse.is_longPress = false;
    //    return;
    //}
    mouse.is_leftClick = false;

    var rect = e.target.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    var p = ctx.getImageData(x, y, 1, 1).data;

    console.log("right color : "+p);

    if(p[0] == 255
    && p[1] == 255
    && p[2] == 255) {
        var p = gameManager.cursor;
        var object = cellList[p.x][p.y][p.z];
        if(object.flag && !object.demined) {
            cellList[p.x][p.y][p.z].flag = false;
        } else if(!object.flag && !object.demined) {
            cellList[p.x][p.y][p.z].flag = true;
        }
    }
   
    return false;
}, false);

document.addEventListener("keydown", e => {
    switch(e.key){
        case "f":
            var p = gameManager.cursor;
            var object = cellList[p.x][p.y][p.z];
            if(object.flag && !object.demined) {
                cellList[p.x][p.y][p.z].flag = false;
                console.log("omit flag at "+p.x+" "+p.y+" "+p.z);
            } else if(!object.flag && !object.demined) {
                cellList[p.x][p.y][p.z].flag = true;
                console.log("put flag at "+p.x+" "+p.y+" "+p.z);
            }
            console.log("demined at ... : "+object.demined);
            break;
        case "x":
            fixedPlane = "yz";
            break;
        case "y":
            fixedPlane = "zx";
            break;
        case "z":
            fixedPlane = "xy";
            break;
        case "e":
            modeChange("easy");
            break;
        case "n":
            modeChange("normal");
            break;
        case "h":
            modeChange("hard");
            break;
        case "r":
            gameInitialize();
            break;
        default:
            break;
    }
    console.log("fixedPlane : "+fixedPlane);

    var keyRotZ = 0, keyRotY = 0;

    if(e.ctrlKey) {
        switch(e.key) {
            case "ArrowLeft":
                keyRotZ = -0.1;
                break;
            case "ArrowRight":
                keyRotZ = 0.1;
                break;
            case "ArrowUp":
                keyRotY = -0.1;
                break;
            case "ArrowDown":
                keyRotY = 0.1;
                break;
            default:
                break;
        }
    } else if(fixedPlane == "yz") {
        switch(e.key) {
            case "ArrowLeft":
                gameManager.cursor.y -= 1;
                if(gameManager.cursor.y < 0) {
                    gameManager.cursor.y += gameManager.size.y;
                } 
                break;
            case "ArrowRight":
                gameManager.cursor.y += 1;
                if(gameManager.cursor.y >= gameManager.size.y) {
                    gameManager.cursor.y -= gameManager.size.y;
                } 
                break;
            case "ArrowUp":
                gameManager.cursor.z -= 1;
                if(gameManager.cursor.z < 0) {
                    gameManager.cursor.z += gameManager.size.z;
                } 
                break;
            case "ArrowDown":
                gameManager.cursor.z += 1;
                if(gameManager.cursor.z >= gameManager.size.z) {
                    gameManager.cursor.z -= gameManager.size.z;
                } 
                break;
            default:
                break;
        }
    } else if(fixedPlane == "zx") {
        switch(e.key) {
            case "ArrowLeft":
                gameManager.cursor.z -= 1;
                if(gameManager.cursor.z < 0) {
                    gameManager.cursor.z += gameManager.size.z;
                } 
                break;
            case "ArrowRight":
                gameManager.cursor.z += 1;
                if(gameManager.cursor.z >= gameManager.size.z) {
                    gameManager.cursor.z -= gameManager.size.z;
                } 
                break;
            case "ArrowUp":
                gameManager.cursor.x -= 1;
                if(gameManager.cursor.x < 0) {
                    gameManager.cursor.x += gameManager.size.x;
                } 
                break;
            case "ArrowDown":
                gameManager.cursor.x += 1;
                if(gameManager.cursor.x >= gameManager.size.x) {
                    gameManager.cursor.x -= gameManager.size.x;
                } 
                break;
            default:
                break;
        }
    } else if(fixedPlane == "xy") {
        switch(e.key) {
            case "ArrowLeft":
                gameManager.cursor.x -= 1;
                if(gameManager.cursor.x < 0) {
                    gameManager.cursor.x += gameManager.size.x;
                } 
                break;
            case "ArrowRight":
                gameManager.cursor.x += 1;
                if(gameManager.cursor.x >= gameManager.size.x) {
                    gameManager.cursor.x -= gameManager.size.x;
                } 
                break;
            case "ArrowUp":
                gameManager.cursor.y -= 1;
                if(gameManager.cursor.y < 0) {
                    gameManager.cursor.y += gameManager.size.y;
                } 
                break;
            case "ArrowDown":
                gameManager.cursor.y += 1;
                if(gameManager.cursor.y >= gameManager.size.y) {
                    gameManager.cursor.y -= gameManager.size.y;
                } 
                break;
            default:
                break;
        }
    }
    
    switch(e.key) {
        case "Enter":
            mouse.is_longPress = false;
            var p = gameManager.cursor;
            var object = cellList[p.x][p.y][p.z];
            if(!object.demined && !object.flag) {
                cellList[p.x][p.y][p.z].demined = true;
                if(object.danger) {
                    gameManager.gameover = true;
                    mouse.is_init = false;
                } else if(is_safe(p)){
                    safechain(p);
                }
            
                if(!gameManager.gameover) {
                    mouse.is_init = true;
                }
            }

            break;
        default:
            break;
    }

    
    for(var i = 0; i < cellIndexList.length; ++i) {
        var p = cellIndexList[i];
        cellList[p.x][p.y][p.z].rotate(keyRotZ, keyRotY);
    }
    
    for(var i = 0; i < 6; ++i) {
        controllerList[i].rotate(keyRotZ, keyRotY);
    }


});

