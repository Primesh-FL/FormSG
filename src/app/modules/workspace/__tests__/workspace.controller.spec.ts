import { ObjectId } from 'bson-ext'
import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import * as WorkspaceService from 'src/app/modules/workspace/workspace.service'
import { IUserSchema, IWorkspaceSchema } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { DatabaseConflictError, DatabaseError } from '../../core/core.errors'
import * as WorkspaceController from '../workspace.controller'
import {
  ForbiddenWorkspaceError,
  WorkspaceNotFoundError,
} from '../workspace.errors'

jest.mock('../workspace.service')
const MockWorkspaceService = mocked(WorkspaceService)

describe('workspace.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getWorkspaces', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      session: {
        user: {
          _id: 'exists',
        },
      },
    })

    it('should return 200 with an array of workspaces', async () => {
      const mockRes = expressHandler.mockResponse()
      MockWorkspaceService.getWorkspaces.mockReturnValueOnce(okAsync([]))
      await WorkspaceController.getWorkspaces(MOCK_REQ, mockRes, jest.fn())

      expect(mockRes.json).toHaveBeenCalledWith([])
    })

    it('should return 409 when database conflict error occurs', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'
      MockWorkspaceService.getWorkspaces.mockReturnValueOnce(
        errAsync(new DatabaseConflictError(mockErrorString)),
      )
      await WorkspaceController.getWorkspaces(MOCK_REQ, mockRes, jest.fn())

      expect(mockRes.status).toBeCalledWith(409)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })

    it('should return 500 when database error occurs', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'
      MockWorkspaceService.getWorkspaces.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )
      await WorkspaceController.getWorkspaces(MOCK_REQ, mockRes, jest.fn())

      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })
  })

  describe('createWorkspace', () => {
    const MOCK_WORKSPACE = {
      _id: new ObjectId() as IWorkspaceSchema['_id'],
      title: 'Workspace1',
      admin: new ObjectId() as IUserSchema['_id'],
      formIds: [],
    }
    const MOCK_REQ = expressHandler.mockRequest({
      session: {
        user: {
          _id: 'exists',
        },
      },
      body: {
        title: MOCK_WORKSPACE.title,
      },
    })

    it('should return 200 with the created workspace', async () => {
      const mockRes = expressHandler.mockResponse()
      MockWorkspaceService.createWorkspace.mockReturnValueOnce(
        okAsync(MOCK_WORKSPACE),
      )
      await WorkspaceController.handleCreateWorkspace(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.json).toHaveBeenCalledWith(MOCK_WORKSPACE)
    })

    it('should return 409 when database conflict error occurs', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'
      MockWorkspaceService.createWorkspace.mockReturnValueOnce(
        errAsync(new DatabaseConflictError(mockErrorString)),
      )
      await WorkspaceController.handleCreateWorkspace(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toBeCalledWith(409)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })

    it('should return 500 when database error occurs', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'
      MockWorkspaceService.createWorkspace.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )
      await WorkspaceController.handleCreateWorkspace(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })
  })

  describe('updateWorkspaceTitle', () => {
    const MOCK_WORKSPACE = {
      _id: new ObjectId() as IWorkspaceSchema['_id'],
      title: 'Workspace1',
      admin: new ObjectId() as IUserSchema['_id'],
      formIds: [],
    }
    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        workspaceId: MOCK_WORKSPACE._id,
      },
      session: {
        user: {
          _id: 'exists',
        },
      },
      body: {
        title: MOCK_WORKSPACE.title,
      },
    })

    it('should return 200 with the updated workspace', async () => {
      const mockRes = expressHandler.mockResponse()
      MockWorkspaceService.getWorkspace.mockReturnValueOnce(
        okAsync(MOCK_WORKSPACE),
      )
      MockWorkspaceService.verifyWorkspaceAdmin.mockReturnValueOnce(
        okAsync(true),
      )
      MockWorkspaceService.updateWorkspaceTitle.mockReturnValueOnce(
        okAsync(MOCK_WORKSPACE),
      )
      await WorkspaceController.handleUpdateWorkspaceTitle(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.json).toHaveBeenCalledWith(MOCK_WORKSPACE)
    })

    it('should return 403 when user is not workspace admin', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'

      MockWorkspaceService.getWorkspace.mockReturnValueOnce(
        okAsync(MOCK_WORKSPACE),
      )
      MockWorkspaceService.verifyWorkspaceAdmin.mockReturnValueOnce(
        errAsync(new ForbiddenWorkspaceError(mockErrorString)),
      )
      await WorkspaceController.handleUpdateWorkspaceTitle(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toBeCalledWith(403)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })

    it('should return 404 when workspace is not found', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'

      MockWorkspaceService.getWorkspace.mockReturnValueOnce(
        errAsync(new WorkspaceNotFoundError(mockErrorString)),
      )
      MockWorkspaceService.verifyWorkspaceAdmin.mockReturnValueOnce(
        okAsync(true),
      )
      await WorkspaceController.handleUpdateWorkspaceTitle(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toBeCalledWith(404)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })

    it('should return 500 when database error occurs', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'

      MockWorkspaceService.getWorkspace.mockReturnValueOnce(
        okAsync(MOCK_WORKSPACE),
      )
      MockWorkspaceService.verifyWorkspaceAdmin.mockReturnValueOnce(
        okAsync(true),
      )
      MockWorkspaceService.updateWorkspaceTitle.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )
      await WorkspaceController.handleUpdateWorkspaceTitle(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })
  })

  describe('deleteWorkspace', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        workspaceId: new ObjectId() as IWorkspaceSchema['_id'],
      },
      session: {
        user: {
          _id: 'exists',
        },
      },
    })

    it('should return 200 with success message', async () => {
      const mockRes = expressHandler.mockResponse()
      MockWorkspaceService.deleteWorkspace.mockReturnValueOnce(okAsync(1))
      await WorkspaceController.deleteWorkspace(MOCK_REQ, mockRes, jest.fn())

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully deleted workspace',
      })
    })

    it('should return 404 when workspace is not found', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'

      MockWorkspaceService.deleteWorkspace.mockReturnValueOnce(
        errAsync(new WorkspaceNotFoundError(mockErrorString)),
      )
      await WorkspaceController.deleteWorkspace(MOCK_REQ, mockRes, jest.fn())

      expect(mockRes.status).toBeCalledWith(404)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })

    it('should return 500 when database error occurs', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'

      MockWorkspaceService.deleteWorkspace.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )
      await WorkspaceController.deleteWorkspace(MOCK_REQ, mockRes, jest.fn())

      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })
  })
})
