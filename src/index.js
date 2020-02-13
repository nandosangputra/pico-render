const render = (template, data) => {
	const varReg = /{{(#?\/?[\s\w-@!=]+)}}/g,
		startLoopReg = /^#foreach (\w*)/g,
		startIfReg = /^#if (.*)/g,
		endLoopReg = /^\/foreach$/g,
		endIfReg = /^\/if$/g,
		globalVarPrefix = 'this.';

	let cursor = 0,
		templateCode = 'let r=[];',
		loopMode = 0,
		arrVar,
		ifCond,
		match;

	const appendCode = (line, isJsCode) => {
		const cleanedLine = line.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/'/g, '\\\'');
		if (isJsCode) {
			if ((arrVar = startLoopReg.exec(cleanedLine))) {
				templateCode = `${templateCode} for(let i=0; i<${globalVarPrefix}${arrVar[1]}.length; i++) { const e = ${globalVarPrefix}${arrVar[1]}[i];`;
				loopMode++;
			} else if ((ifCond = startIfReg.exec(cleanedLine))) {
				templateCode = `${templateCode} if (${ifCond[1].replace('@index', 'i')}) {`;
			} else if (line.match(endLoopReg)) {
				templateCode = `${templateCode} };`;
				loopMode--;
			} else if (line.match(endIfReg)) {
				templateCode = `${templateCode} };`;
			} else {
                let variableName =  `${loopMode ? `e.${cleanedLine} ||` : ''} ${globalVarPrefix}${cleanedLine} || '{${cleanedLine}}'`;
				templateCode = `${templateCode} r.push(typeof (${variableName}) === 'string' ? (${variableName}).replace(/"/g, '\\\\"') : ${variableName});`;
			}
		} else {
			templateCode = `${templateCode} r.push('${cleanedLine}');`;
		}
	};

	while((match = varReg.exec(template)))
	{
		appendCode(template.slice(cursor, match.index));
		appendCode(match[1], true);
		cursor = match.index + match[0].length;
	}

	appendCode(template.slice(cursor));
	templateCode = `${templateCode} return r.join('');`;

	return new Function(templateCode).apply(data);
};

export default render;
