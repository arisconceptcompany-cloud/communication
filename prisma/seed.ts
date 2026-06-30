import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function todayBirthYear(year: number) {
  const d = new Date();
  d.setFullYear(year);
  return d;
}

async function ensureHubDoc(data: {
  title: string;
  description?: string;
  url?: string;
  category: string;
  sortOrder: number;
}) {
  const existing = await prisma.hubDocument.findFirst({
    where: { title: data.title },
  });
  if (!existing) {
    await prisma.hubDocument.create({ data });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash("ValueIT2026!", 12);
  const employeBirth = todayBirthYear(1992);

  await prisma.user.upsert({
    where: { email: "admin@value-it.mg" },
    update: {},
    create: {
      email: "admin@value-it.mg",
      name: "Administrateur Intranet",
      passwordHash,
      role: Role.ADMIN,
      department: "Direction",
    },
  });

  await prisma.user.upsert({
    where: { email: "rh@value-it.mg" },
    update: {},
    create: {
      email: "rh@value-it.mg",
      name: "Ressources Humaines",
      passwordHash,
      role: Role.RH,
      department: "RH",
    },
  });

  await prisma.user.upsert({
    where: { email: "employe@value-it.mg" },
    update: { birthDate: employeBirth },
    create: {
      email: "employe@value-it.mg",
      name: "Employé Démo",
      passwordHash,
      role: Role.EMPLOYEE,
      department: "Opérations",
      birthDate: employeBirth,
    },
  });

  const existingOrg = await prisma.orgNode.count();
  if (existingOrg === 0) {
    const direction = await prisma.orgNode.create({
      data: {
        name: "Direction Générale",
        title: "Direction",
        department: "Direction",
        sortOrder: 0,
      },
    });

    const rh = await prisma.orgNode.create({
      data: {
        name: "Ressources Humaines",
        title: "Département RH",
        department: "RH",
        parentId: direction.id,
        sortOrder: 1,
      },
    });

    const ops = await prisma.orgNode.create({
      data: {
        name: "Opérations & Data",
        title: "Département Opérations",
        department: "Opérations",
        parentId: direction.id,
        sortOrder: 2,
      },
    });

    await prisma.orgNode.createMany({
      data: [
        {
          name: "Responsable RH",
          title: "Manager RH",
          email: "rh@value-it.mg",
          department: "RH",
          parentId: rh.id,
          sortOrder: 0,
        },
        {
          name: "Chef d'équipe Data",
          title: "Team Lead",
          email: "data@value-it.mg",
          department: "Opérations",
          parentId: ops.id,
          sortOrder: 0,
        },
        {
          name: "Analystes Prix",
          title: "Équipe",
          department: "Opérations",
          parentId: ops.id,
          sortOrder: 1,
        },
      ],
    });
  }

  const hubCount = await prisma.hubDocument.count();
  if (hubCount === 0) {
    await prisma.hubDocument.createMany({
      data: [
        {
          title: "Charte interne Value-IT",
          description: "Règlement intérieur et valeurs d'entreprise",
          url: "https://betav3-valueit.aris-cc.com/about/",
          category: "document",
          sortOrder: 0,
        },
        {
          title: "Procédures qualité",
          description: "Processus SOC 2 et bonnes pratiques",
          url: "/rh",
          category: "document",
          sortOrder: 1,
        },
        {
          title: "Contacts utiles",
          description: "Support IT, RH et direction — contact@value-it.mg",
          url: "mailto:contact@value-it.mg",
          category: "ressource",
          sortOrder: 2,
        },
      ],
    });
  }

  await ensureHubDoc({
    title: "Guide paie & bulletins",
    description: "Accès aux bulletins et calendrier de paie",
    url: "/rh",
    category: "paie",
    sortOrder: 0,
  });
  await ensureHubDoc({
    title: "Mutuelle entreprise",
    description: "Adhésion, remboursements et contacts mutuelle",
    url: "/rh",
    category: "mutuelle",
    sortOrder: 1,
  });
  await ensureHubDoc({
    title: "Planning & congés",
    description: "Demandes de congés et planning d'équipe",
    url: "/rh",
    category: "planning",
    sortOrder: 2,
  });

  const michael = await prisma.user.upsert({
    where: { email: "michael@value-it.mg" },
    update: {},
    create: {
      email: "michael@value-it.mg",
      name: "Michaël Raharison",
      passwordHash,
      role: Role.EMPLOYEE,
      department: "Technique",
    },
  });

  const mamy = await prisma.user.upsert({
    where: { email: "mamy@value-it.mg" },
    update: {},
    create: {
      email: "mamy@value-it.mg",
      name: "Mamy",
      passwordHash,
      role: Role.EMPLOYEE,
      department: "Tech",
    },
  });

  const welcomeExists = await prisma.announcement.findFirst({
    where: { title: { contains: "DU NOUVEAU CHEZ VALUE-IT" } },
  });

  if (!welcomeExists) {
    const rhUser = await prisma.user.findUnique({
      where: { email: "rh@value-it.mg" },
    });
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@value-it.mg" },
    });
    if (rhUser) {
      const pollEnds = new Date();
      pollEnds.setDate(pollEnds.getDate() + 2);

      const post = await prisma.announcement.create({
        data: {
          title: "🌟 DU NOUVEAU CHEZ VALUE-IT ! 🌟",
          body: `Bonjour à tous ! Grande nouvelle aujourd'hui. Nous accueillons notre nouveau Leader Technique.\nPlus de détails sur les nouveaux objectifs ici : https://www.valueit.local/objectifs2026\n\n#Welcome #TeamValueIt #Innovation`,
          category: "celebration",
          authorId: rhUser.id,
          pinned: true,
          moodActivity: "À l'écoute de l'équipe",
          location: "à VALUE-IT — Siège Antananarivo",
          targetDepartment: "Technique",
          allowAnonymousComments: true,
          taggedUserIds: JSON.stringify(
            [michael.id, adminUser?.id].filter(Boolean)
          ),
          mediaGallery: JSON.stringify([
            {
              type: "image",
              url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
              label: "Photo de bienvenue",
            },
            {
              type: "video",
              url: "https://www.w3schools.com/html/mov_bbb.mp4",
              label: "Mot du directeur (01:20)",
            },
          ]),
          linkClicks: 45,
          shareCount: 12,
        },
      });

      const poll = await prisma.postPoll.create({
        data: {
          postId: post.id,
          question:
            "À quel projet de bienvenue voulez-vous participer pour l'équipe ?",
          expiresAt: pollEnds,
          options: {
            create: [
              {
                label: "Option A : Petit-déjeuner d'accueil vendredi matin ☕",
                sortOrder: 0,
              },
              {
                label: "Option B : Afterwork d'intégration ce jeudi soir 🍕",
                sortOrder: 1,
              },
            ],
          },
        },
        include: { options: true },
      });

      const employe = await prisma.user.findUnique({
        where: { email: "employe@value-it.mg" },
      });
      const [optA, optB] = poll.options;
      const pollVoters: { id: string }[] = [];
      for (let i = 0; i < 44; i++) {
        const email = `voter${i}@value-it.mg`;
        const v = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: `Collaborateur ${i + 1}`,
            passwordHash,
            role: Role.EMPLOYEE,
            department: i % 2 === 0 ? "Technique" : "Opérations",
          },
        });
        pollVoters.push(v);
      }
      for (let i = 0; i < pollVoters.length; i++) {
        const option = i < 28 ? optA : optB;
        if (!option) continue;
        await prisma.postPollVote.create({
          data: {
            pollId: poll.id,
            optionId: option.id,
            userId: pollVoters[i].id,
          },
        });
      }

      if (mamy) {
        await prisma.postComment.create({
          data: {
            postId: post.id,
            authorId: mamy.id,
            body: "Bienvenue dans la team ! Hâte de bosser ensemble. 🔥",
          },
        });
      }

      if (employe && michael) {
        const parent = await prisma.postComment.findFirst({
          where: { postId: post.id, authorId: mamy.id },
        });
        if (parent) {
          await prisma.postComment.create({
            data: {
              postId: post.id,
              authorId: michael.id,
              parentId: parent.id,
              body: "Merci Mamy, ravi d'être là ! 🙌",
            },
          });
        }
        await prisma.postComment.create({
          data: {
            postId: post.id,
            authorId: employe.id,
            isAnonymous: true,
            anonymousLabel: "Anonyme_Renard",
            body: "Super initiative pour le petit-déj ! (Posté anonymement)",
          },
        });
      }

      const reactionUsers = [employe, mamy, michael, adminUser].filter(
        Boolean
      ) as { id: string }[];
      const types = ["like", "love", "idea", "wow", "clap"];
      for (let i = 0; i < reactionUsers.length; i++) {
        await prisma.postReaction.upsert({
          where: {
            postId_userId: {
              postId: post.id,
              userId: reactionUsers[i].id,
            },
          },
          create: {
            postId: post.id,
            userId: reactionUsers[i].id,
            type: types[i % types.length],
          },
          update: {},
        });
      }
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
