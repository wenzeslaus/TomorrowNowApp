/*
 * Filename: OutputParameter.js
 * Project: TomorrowNow
 * File Created: Wednesday May 25th 2022
 * Author: Corey White (smortopahri@gmail.com)
 * Maintainer: Corey White
 * -----
 * Last Modified: Fri May 27 2022
 * Modified By: Corey White
 * -----
 * License: GPLv3
 * 
 * Copyright (c) 2022 TomorrowNow
 * 
 * TomorrowNow is an open-source geospatial participartory modeling platform
 * to enable stakeholder engagment in socio-environmental decision-makeing.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * 
 */

import { STACMetadata } from "./STACMetadata";
import { ExportParam } from "./ExportParam";

/**
 * @description Parameter definition of a GRASS GIS module that should be executed in the actinia environment. Parameters can be of type input or output. A GRASS GIS module will be usually called like: <p>g.region raster=elevation30m@PERMANENT</p> The GRASS GIS module *g.region* parameter *raster* has the value *elevation30m@PERMANENT*. This is reflected by the *param* and *value* properties that can specify input and output parameters.
 * @param {String} param The name of a GRASS GIS module parameter like *map* or *elevation*. 
 * @param {String} value The value of the GRASS GIS module parameter. Raster, vector and STDS inputs must contain the mapset name in their id: *slope@PERMANENT*, if they are not located in the working mapset. Do not contain the mapset name in map names that are processed, since the mapsets are generated on demand using random names. Outputs are not allowed to contain mapset names.Files that are created in the process chain to exchange data can be specified using the *$file::unique_id* identifier. The **unique_id** will be replaced with a temporary file name, that is available in the whole process chain at runtime. The **unique_id**  is the identifier that can be used by different modules in a process chain to access the same temporary file or to prepare it for export.
 * @param {Object | ExportParam} [output = undefined] The raster, vector or text file export parameter.
 * @param {Object | STACMetadata} [metadata = undefined] The STAC file export parameter.
 */
export class OutputParameter {
    constructor(param, value, output=undefined, metadata=undefined) {
        this.param = param;
        this.value = value;
        this.output = output;
        this.metadata = metadata;

        if (typeof output === 'object' && !(output instanceof ExportParam)) {
            this.output = new ExportParam(...output);
        }

        if (typeof metadata === 'object' && !(output instanceof STACMetadata)) {
            this.metadata = new STACMetadata(...metadata);
        }
        
    }
}