"use strict"

$(document).ready(function() {
    let divIntestazione = $("#divIntestazione")
    let divFilters = $(".card").eq(0)
    let divCollections = $("#divCollections")
    let table = $("#mainTable")
    let divDettagli = $("#divDettagli")
    let btnAdd = $("#btnAdd").prop("disabled", "true");
    let currentCollection = "";
    let lstHair = $("#lstHair");

    divFilters.hide()
	$("#lstHair").prop("selectedIndex", -1);
    
    getCollection();

    async function getCollection() 
    {
        const data = await inviaRichiesta("GET", "/api/getCollection");
        if(data)
        {
            console.log(data);
            const label = divCollections.children("label");
            for (const collection of data) {
                const clonedLabel=label.clone().appendTo(divCollections);
                clonedLabel.children("span").text(collection.name);
                clonedLabel.children("input").val(collection.name).on("click", function(){
                    currentCollection = this.value;
                    btnAdd.prop("disabled", "false");
                    getDataCollection();
                });
            }
            label.remove();
        }
    }

    btnAdd.on("click", function(){
        divDettagli.empty();
        $("<textarea>").appendTo(divDettagli).prop("placeholder", '{"Name": "Pippo"}');
        $("<btn>").appendTo(divDettagli).text("Salva").addClass("btn btn-success btn-sm")
        .on("click", function(){
            let record = divDettagli.find("textarea").val();
            try{
                record=JSON.parse(record);
            } catch (error){
                alert("JSON non valido\n"+error);
                return
            }
            let data=inviaRichiesta("POST", "/api/"+currentCollection, record);
            if(data){
                console.log(data);
                alert("Record inserito correttamente");
                getDataCollection();
            }
        })
    });
    
    async function getDataCollection(filter={}) 
    {
        divDettagli.empty();
        const data = await inviaRichiesta("GET", "/api/" + currentCollection, filter);
        if(data)
        {
            console.log(data);

            divIntestazione.find("strong").eq(0).text(currentCollection);
            divIntestazione.find("strong").eq(1).text(data.length);

            let tbody = table.children("tbody");
            tbody.empty();

            data.forEach((item, i )=> {
                let key = Object.keys(item)[1];
                let tr = $("<tr>").appendTo(tbody);

                $("<td>").appendTo(tr).text(item["_id"]).on("click", function(){
                    getDetails(item["_id"]);
                });

                $("<td>").appendTo(tr).text(item[key]).on("click", function(){
                    getDetails(item["_id"]);
                });

                let td= $("<td>").appendTo(tr);
                $("<div>").appendTo(td).on('click', () => {getDetails(item['_id'], "PATCH")});
                $("<div>").appendTo(td).on("click", ()=> {putRecord(item["_id"])});
                $("<div>").appendTo(td).on('click', () => {deleteRecord(item["_id"])})
            });

            if(currentCollection=="unicorns"){
                divFilters.show();
            } else {
                divFilters.hide();
                divFilters.find("input:checkbox").prop("checked", false);
                lstHair.prop("selectedIndex", -1);
            }
        }
    }

    async function putRecord(id) {
        divDettagli.empty();
        const textarea=$("<textarea>").appendTo(divDettagli).prop("placeholder", '$inc:{vampires:2}');
        $("<btn>").appendTo(divDettagli).text("Update").addClass("btn btn-success btn-sm").on("click", async function(){
            if(textarea.val()){
                let json
                try{
                    json=JSON.parse(textarea.val());
            
                } catch (error){
                    alert("JSON non valido\n"+error);
                    return
                }
                const data= await inviaRichiesta("PUT", "/api/"+currentCollection+"/"+id, {action : json});
                if(data?.modifiedCount === 1){
                    alert("Record modificato correttamente");
                    getDataCollection();
                } else {
                    alert("Errore nella modifica del record");
                }
            }
        });
    }

    async function deleteRecord(id) {
        if(confirm("Vuoi davvero cancellare il record: "+id+"?")){
            const data= await inviaRichiesta("DELETE", "/api/"+ currentCollection+"/" + id)
            if(data){
                alert("record rimosso correttamente")
                getDataCollection()
            }
        }
    }

    let btnFind = $("#btnFind").on("click", function(){
        let hair=lstHair.val();
        let gender="";
        if(divFilters.find("input:checkbox:checked").length==1){
            gender=divFilters.find("input:checkbox:checked").val();
        }
        let filters={};
        if(hair){
            filters["hair"]=hair.toLowerCase();
        }
        if(gender){
            filters["gender"]=gender.toLowerCase();
        }
        getDataCollection(filters);
    });

    async function getDetails(id, method = "GET") {
        let data = await inviaRichiesta("GET", "/api/"+ currentCollection+"/" + id);
        if(data){
            divDettagli.empty();
            if(method="GET"){
                for (const key in data) {
                    $("strong").appendTo(divDettagli).text(key);
                    $("<span>").appendTo(divDettagli).text(JSON.stringify(data[key]));
                    $("<br>").appendTo(divDettagli);
                }
            } else{
                delete data["_id"];
                const textarea=$("<textarea>").appendTo(divDettagli)
                .val(JSON.stringify(data, null, 2))
                .css("height", textarea.get(0).scrollHeight + "px");
                $("<btn>").appendTo(divDettagli).text("Save").addClass("btn btn-success btn-sm").on("click", async function(){
                    if(textarea.val()){
                        let json
                        try{
                            json=JSON.parse(textarea.val());
                    
                        } catch (error){
                            alert("JSON non valido\n"+error);
                            return
                        }
                        if('_id' in json){
                            delete json["_id"];
                        }
                        const data= await inviaRichiesta("PATCH", "/api/"+currentCollection+"/"+id, json);
                        if(data?.modifiedCount === 1){
                            alert("Record modificato correttamente");
                            getDataCollection();
                        } else {
                            alert("Errore nella modifica del record");
                        }
                    }
                });
            }
        }
    }
});