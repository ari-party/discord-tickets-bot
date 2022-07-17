const { logAdminEvent } = require('../../../../../../lib/logging');

module.exports.delete = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = res.context.config.client;
		const categoryId = Number(req.params.category);
		const category = await client.prisma.category.delete({ where: { id: categoryId } });

		logAdminEvent(client, {
			action: 'delete',
			guildId: req.params.guild,
			target: {
				id: category.id,
				name: category.name,
				type: 'category',
			},
			userId: req.user.payload.id,
		});

		return category;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.get = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = res.context.config.client;
		const categoryId = Number(req.params.category);
		const category = await client.prisma.category.findUnique({
			include: {
				questions: {
					select: {
						createdAt: true,
						id: true,
						label: true,
						maxLength: true,
						minLength: true,
						order: true,
						placeholder: true,
						required: true,
						style: true,
						value: true,
					},
				},
			},
			where: { id: categoryId  },
		});

		return category;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.patch = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = res.context.config.client;
		const categoryId = Number(req.params.category);
		const guild = client.guilds.cache.get(req.params.guild);
		const data = req.body;
		const original = req.params.category && await client.prisma.category.findUnique({ where: { id: categoryId } });
		if (!original) return res.status(404);

		const category = await client.prisma.category.update({
			data: {
				...data,
				questions: {
					upsert: data.questions?.map(q => ({
						create: q,
						update: q,
						where: { id: q.id },
					})),
				},
			},
			where: { id: categoryId },
		});

		logAdminEvent(client, {
			action: 'update',
			diff: {
				original,
				updated: category,
			},
			guildId: guild.id,
			target: {
				id: category.id,
				name: category.name,
				type: 'category',
			},
			userId: req.user.payload.id,
		});

		return category;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});